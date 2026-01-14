import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { List, FAB, Dialog, Portal, TextInput, useTheme, Button, Text } from 'react-native-paper';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}


export default function CategoryScreen() {
    const { user } = useAuth();
    const theme = useTheme();
    const [categories, setCategories] = useState<Category[]>([]);
    const [visible, setVisible] = useState(false);
    const [categoryName, setCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'categories'), where('userId', '==', user.uid));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(list);
        });

        return () => unsubscribe();
    }, [user]);

    const showDialog = (category?: Category) => {
        if (category) {
            setEditingCategory(category);
            setCategoryName(category.name);
        } else {
            setEditingCategory(null);
            setCategoryName('');
        }
        setVisible(true);
    };

    const hideDialog = () => {
        setVisible(false);
        setEditingCategory(null);
        setCategoryName('');
    };

    const handleSave = async () => {
        if (!categoryName.trim()) return;

        setLoading(true);
        try {
            if (editingCategory) {
                // Update
                await updateDoc(doc(db, 'categories', editingCategory.id), {
                    name: categoryName.trim()
                });
            } else {
                // Add
                await addDoc(collection(db, 'categories'), {
                    userId: user?.uid,
                    name: categoryName.trim(),
                    icon: 'tag', // Default icon for new ones
                    color: theme.colors.primary
                });
            }
            hideDialog();
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save category');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Delete Category', 'Are you sure?', [
            { text: 'Cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'categories', id));
                    } catch (error) {
                        console.error(error);
                        Alert.alert('Error', 'Failed to delete');
                    }
                }
            }
        ]);
    };

    

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            
            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name}
                        left={() => <List.Icon icon={item.icon || 'folder'} color={item.color || theme.colors.primary} />}
                        right={() => <List.Icon icon="pencil" />}
                        onPress={() => showDialog(item)}
                        onLongPress={() => handleDelete(item.id)}
                        style={styles.item}
                    />
                )}
            />

            <Portal>
                <Dialog visible={visible} onDismiss={hideDialog}>
                    <Dialog.Title>{editingCategory ? 'Edit Category' : 'Add Category'}</Dialog.Title>
                    <Dialog.Content>
                        <TextInput
                            label="Category Name"
                            value={categoryName}
                            onChangeText={setCategoryName}
                            style={{ backgroundColor: 'transparent' }}
                        />
                    </Dialog.Content>
                    <Dialog.Actions>
                        {editingCategory && (
                            <Button
                                onPress={() => {
                                    hideDialog();
                                    handleDelete(editingCategory.id);
                                }}
                                textColor={theme.colors.error}
                            >
                                Delete
                            </Button>
                        )}
                        <Button onPress={hideDialog}>Cancel</Button>
                        <Button onPress={handleSave} loading={loading}>Save</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => showDialog()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    item: {
        backgroundColor: 'white',
        marginVertical: 1,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    emptyState: {
        padding: 20,
        alignItems: 'center',
        marginTop: 50,
    }
});
