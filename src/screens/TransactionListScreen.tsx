import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { List, Text, useTheme, FAB } from 'react-native-paper';
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useAuth } from '../context/AuthContext';

export default function TransactionListScreen({ navigation }: { navigation: any }) {
    const theme = useTheme();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTransactions(txs);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (id: string) => {
        Alert.alert('Delete Transaction', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(db, 'transactions', id));
                    } catch (error) {
                        console.error('Error deleting transaction:', error);
                        Alert.alert('Error', 'Could not delete transaction');
                    }
                }
            }
        ]);
    };

    const getAmountColor = (type: string) => {
        return type === 'income' ? '#4CAF50' : '#F44336';
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.title}
                        description={`${formatDate(item.date)} • ${item.category}`}
                        right={() => (
                            <Text
                                variant="bodyLarge"
                                style={{ alignSelf: 'center', color: getAmountColor(item.type), fontWeight: 'bold' }}
                            >
                                {item.type === 'income' ? '+' : '-'}DH {item.amount}
                            </Text>
                        )}
                        style={styles.item}
                        left={() => <List.Icon icon={item.type === 'income' ? "arrow-up-circle" : "arrow-down-circle"} color={getAmountColor(item.type)} />}
                        onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
                        onLongPress={() => handleDelete(item.id)}
                    />
                )}
            />

            <FAB
                icon="plus"
                style={styles.fab}
                onPress={() => navigation.navigate('AddTransaction', { transaction: null })}
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
});
