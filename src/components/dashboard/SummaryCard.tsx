import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

interface SummaryCardProps {
    title: string;
    amount: number;
    type: 'income' | 'expense' | 'balance';
    currency?: string;
}

export default function SummaryCard({ title, amount, type, currency = 'DH ' }: SummaryCardProps) {
    const theme = useTheme();

    const getTextColor = () => {
        if (type === 'income') return '#4CAF50';
        if (type === 'expense') return '#F44336';
        return theme.colors.primary;
    };

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{title}</Text>
                <Text variant="headlineMedium" style={{ color: getTextColor(), fontWeight: 'bold' }}>
                    {currency}{amount.toLocaleString()}
                </Text>
            </Card.Content>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        margin: 5,
        minWidth: '30%',
        elevation: 2,
    },
});
