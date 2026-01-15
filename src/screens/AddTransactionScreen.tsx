import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, SegmentedButtons, useTheme, Portal, Dialog, List, RadioButton, Text } from 'react-native-paper';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function AddTransactionScreen({ navigation, route }: { navigation: any, route: any }) {
    const theme = useTheme();
    const { user } = useAuth();

    const editingTransaction = route.params?.transaction;

    const [type, setType] = useState(editingTransaction?.type || 'expense');
    const [amount, setAmount] = useState(editingTransaction?.amount?.toString() || '');
    const [title, setTitle] = useState(editingTransaction?.title || '');
    const [category, setCategory] = useState(editingTransaction?.category || '');

    const [loading, setLoading] = useState(false);

    const [categories, setCategories] = useState<any[]>([]);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    useEffect(() => {
        if (!user) return;
        
        const q = query(collection(db, 'categories'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(list);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        navigation.setOptions({
            title: editingTransaction ? 'Edit Transaction' : 'Add Transaction',
        });
    }, [editingTransaction]);

    const handleSave = async () => {
        if (!amount || !title || !category) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const transactionData = {
                type,
                amount: parseFloat(amount),
                title,
                category,
                userId: user?.uid,
                date: editingTransaction ? editingTransaction.date : serverTimestamp(),
            };

            if (editingTransaction) {
                await updateDoc(doc(db, 'transactions', editingTransaction.id), transactionData);
            } else {
                await addDoc(collection(db, 'transactions'), transactionData);
            }

            setLoading(false);
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('Main');
            }
        } catch (error) {
            console.error('Error saving transaction: ', error);
            setLoading(false);
            Alert.alert('Error', 'Could not save transaction');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.form}>
                <SegmentedButtons
                    value={type}
                    onValueChange={setType}
                    buttons={[
                        { value: 'expense', label: 'Expense', icon: 'arrow-down' },
                        { value: 'income', label: 'Income', icon: 'arrow-up' },
                    ]}
                    style={styles.input}
                />

                <TextInput
                    label="Amount"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    style={styles.input}
                    left={<TextInput.Affix text="DH" />}
                />

                <TextInput
                    label="Title / Description"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.input}
                />

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

                <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button}>
                    {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
                </Button>

                {editingTransaction && (
                    <Button
                        mode="outlined"
                        onPress={() => {
                            Alert.alert('Delete Transaction', 'Are you sure?', [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                        setLoading(true);
                                        try {
                                            await deleteDoc(doc(db, 'transactions', editingTransaction.id));
                                            setLoading(false);
                                            navigation.goBack();
                                        } catch (error) {
                                            console.error(error);
                                            setLoading(false);
                                            Alert.alert('Error', 'Failed to delete');
                                        }
                                    }
                                }
                            ]);
                        }}
                        style={[styles.button, { borderColor: theme.colors.error }]}
                        textColor={theme.colors.error}
                    >
                        Delete Transaction
                    </Button>
                )}
            </View>

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
                                    <Button onPress={() => {
                                        setShowCategoryPicker(false);
                                        navigation.navigate('Categories');
                                    }}>Create Category</Button>
                                </View>
                            )}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setShowCategoryPicker(false)}>Cancel</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
        paddingVertical: 6,
    }
});
