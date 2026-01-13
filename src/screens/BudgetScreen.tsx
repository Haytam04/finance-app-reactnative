import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { ProgressBar, Card, Text, useTheme, FAB, Portal, Dialog, TextInput, Button, List } from 'react-native-paper';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function BudgetScreen() {
    const theme = useTheme();
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [visible, setVisible] = useState(false);

    // Form State
    const [category, setCategory] = useState('');
    const [limit, setLimit] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Category Selection
    const [categories, setCategories] = useState<any[]>([]);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    useEffect(() => {
        if (!user) return;

        // 1. Fetch Budgets
        const budgetQ = query(collection(db, 'budgets'), where('userId', '==', user.uid));
        const unsubBudgets = onSnapshot(budgetQ, (snapshot) => {
            const bList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBudgets(bList);
        });

        // 2. Fetch Transactions
        const txQ = query(collection(db, 'transactions'), where('userId', '==', user.uid), where('type', '==', 'expense'));
        const unsubTx = onSnapshot(txQ, (snapshot) => {
            const txList = snapshot.docs.map(doc => ({ ...doc.data() }));
            setTransactions(txList);
        });

        // 3. Fetch Categories
        const catQ = query(collection(db, 'categories'), where('userId', '==', user.uid));
        const unsubCat = onSnapshot(catQ, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(list);
        });

        return () => {
            unsubBudgets();
            unsubTx();
            unsubCat();
        };
    }, [user]);

    const calculateSpent = (categoryName: string) => {
        if (!categoryName) return 0;
        return transactions
            .filter((t: any) => t.category && t.category.toLowerCase() === categoryName.toLowerCase())
            .reduce((sum, t: any) => sum + (parseFloat(t.amount) || 0), 0);
    };

    const handleOpenDialog = (budget?: any) => {
        if (budget) {
            setCategory(budget.category);
            setLimit(budget.limit.toString());
            setEditingId(budget.id);
        } else {
            setCategory('');
            setLimit('');
            setEditingId(null);
        }
        setVisible(true);
    };

    const handleSaveBudget = async () => {
        if (!category || !limit) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await updateDoc(doc(db, 'budgets', editingId), {
                    category: category.trim(),
                    limit: parseFloat(limit),
                });
            } else {
                // Check dupes
                const existing = budgets.find((b: any) => b.category.toLowerCase() === category.toLowerCase());
                if (existing) {
                    Alert.alert('Exists', 'Budget for this category already exists. Updated instead.');
                    await updateDoc(doc(db, 'budgets', existing.id), {
                        limit: parseFloat(limit),
                    });
                } else {
                    await addDoc(collection(db, 'budgets'), {
                        userId: user?.uid,
                        category: category.trim(),
                        limit: parseFloat(limit),
                        color: theme.colors.primary,
                    });
                }
            }

            setCategory('');
            setLimit('');
            setVisible(false);
            setEditingId(null);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save budget');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, 'budgets', id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
                {budgets.length === 0 ? (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.secondary }}>
                        No budgets set. Add one to track your spending!
                    </Text>
                ) : (
                    budgets.map((budget, index) => {
                        const spent = calculateSpent(budget.category);
                        const progress = budget.limit > 0 ? spent / budget.limit : 0;
                        const isOver = spent > budget.limit;
                        const color = progress > 0.9 ? theme.colors.error : (budget.color || theme.colors.primary);

                        return (
                            <Card
                                key={index}
                                style={styles.card}
                                onPress={() => handleOpenDialog(budget)}
                                onLongPress={() => Alert.alert('Delete Budget?', `Delete budget for ${budget.category}?`, [{ text: 'Cancel' }, { text: 'Delete', onPress: () => handleDelete(budget.id) }])}
                            >
                                <Card.Content>
                                    <View style={styles.row}>
                                        <Text variant="titleMedium">{budget.category}</Text>
                                        <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                                            DH {spent.toFixed(0)} / DH {budget.limit}
                                        </Text>
                                    </View>
                                    <ProgressBar
                                        progress={progress > 1 ? 1 : progress}
                                        color={color}
                                        style={{ height: 10, borderRadius: 5, marginTop: 10 }}
                                    />
                                    {isOver && <Text style={{ color: theme.colors.error, marginTop: 5, fontWeight: 'bold' }}>Over Budget!</Text>}
                                    {!isOver && progress > 0.8 && <Text style={{ color: theme.colors.error, marginTop: 5 }}>Warning: Near Limit!</Text>}
                                </Card.Content>
                            </Card>
                        );
                    })
                )}
            </ScrollView>

            {/* Budget Form Dialog */}
            <Portal>
                <Dialog visible={visible} onDismiss={() => setVisible(false)}>
                    <Dialog.Title>{editingId ? 'Edit Budget' : 'Set Budget'}</Dialog.Title>
                    <Dialog.Content>
                        <TouchableOpacity onPress={() => setShowCategoryPicker(true)}>
                            <TextInput
                                label="Category"
                                value={category}
                                editable={false}
                                style={styles.input}
                                right={<TextInput.Icon icon="chevron-down" />}
                                pointerEvents="none"
                            />
                        </TouchableOpacity>

                        <TextInput
                            label="Monthly Limit (DH)"
                            value={limit}
                            onChangeText={setLimit}
                            keyboardType="numeric"
                            style={styles.input}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        {editingId && (
                            <Button
                                onPress={() => {
                                    setVisible(false);
                                    Alert.alert('Delete Budget?', 'Are you sure?', [
                                        { text: 'Cancel' },
                                        { text: 'Delete', onPress: () => handleDelete(editingId), style: 'destructive' }
                                    ]);
                                }}
                                textColor={theme.colors.error}
                            >
                                Delete
                            </Button>
                        )}
                        <Button onPress={() => setVisible(false)}>Cancel</Button>
                        <Button onPress={handleSaveBudget} loading={loading}>Save</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* Category Picker Dialog */}
            <Portal>
                <Dialog visible={showCategoryPicker} onDismiss={() => setShowCategoryPicker(false)}>
                    <Dialog.Title>Select Category</Dialog.Title>
                    <Dialog.ScrollArea style={{ maxHeight: 300, paddingHorizontal: 0 }}>
                        <ScrollView>
                            {categories.length > 0 ? (
                                categories.map((cat) => (
                                    <List.Item
                                        key={cat.id}
                                        title={cat.name}
                                        left={() => <List.Icon icon={cat.icon || 'tag'} color={cat.color || theme.colors.primary} />}
                                        onPress={() => {
                                            setCategory(cat.name);
                                            setShowCategoryPicker(false);
                                        }}
                                        style={{ paddingHorizontal: 24 }}
                                    />
                                ))
                            ) : (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text>No categories found.</Text>
                                </View>
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setShowCategoryPicker(false)}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB
                icon="plus"
                label="Add Budget"
                style={styles.fab}
                onPress={() => handleOpenDialog()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    card: { marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    input: {
        marginBottom: 10,
    }
});
