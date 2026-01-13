import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import SummaryCard from '../components/dashboard/SummaryCard';
import { PieChart, LineChart } from 'react-native-gifted-charts';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

export default function DashboardScreen() {
    const { user } = useAuth();
    const theme = useTheme();

    // State for dashboard data
    const [income, setIncome] = useState(0);
    const [expense, setExpense] = useState(0);
    const [lineData, setLineData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalIncome = 0;
            let totalExpense = 0;
            const categoryMap: { [key: string]: number } = {};
            const dailyData: { [key: string]: number } = {};

            // Generate labels for last 7 days
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayName = days[date.getDay()];
                const dateStr = date.toISOString().split('T')[0];
                last7Days.push({ dateStr, label: dayName });
                dailyData[dateStr] = 0;
            }

            const colors = ['#177AD5', '#79D2DE', '#ED6665', '#FF9F40', '#4BC0C0', '#9966FF'];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const amt = parseFloat(data.amount) || 0;
                const timestamp = data.date;

                if (data.type === 'income') {
                    totalIncome += amt;
                } else if (data.type === 'expense') {
                    totalExpense += amt;
                    const cat = data.category || 'Other';
                    categoryMap[cat] = (categoryMap[cat] || 0) + amt;

                    // Aggregate by Date for Trend
                    if (timestamp) {
                        const dateObj = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
                        const dateStr = dateObj.toISOString().split('T')[0];
                        if (dailyData[dateStr] !== undefined) {
                            dailyData[dateStr] += amt;
                        }
                    }
                }
            });

            setIncome(totalIncome);
            setExpense(totalExpense);

            const pData = Object.keys(categoryMap).map((cat, index) => ({
                value: categoryMap[cat],
                text: `${Math.round((categoryMap[cat] / totalExpense) * 100)}%`,
                color: colors[index % colors.length] || '#CCCCCC',
                legend: cat
            }));
            setPieData(pData.length > 0 ? pData : [{ value: 1, color: '#E0E0E0', text: 'No Data' }]);

            // Format Line Chart Data
            const lData = last7Days.map(day => ({
                value: dailyData[day.dateStr],
                label: day.label
            }));
            setLineData(lData);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineSmall" style={styles.greeting}>Hello, {user?.displayName || 'User'}</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>Financial Overview</Text>
            </View>

            <View style={styles.summaryContainer}>
                <SummaryCard title="Income" amount={income} type="income" />
                <SummaryCard title="Expense" amount={expense} type="expense" />
            </View>
            <View style={styles.summaryContainer}>
                <SummaryCard title="Balance" amount={income - expense} type="balance" />
            </View>


            <View style={styles.chartSection}>
                <Text variant="titleMedium" style={styles.chartTitle}>Expenses by Category</Text>
                {pieData.length > 0 && pieData[0].text !== 'No Data' ? (
                    <View style={styles.chartWrapper}>
                        <PieChart
                            data={pieData}
                            donut
                            showText
                            textColor="black"
                            radius={80}
                            innerRadius={50}
                            textSize={12}
                            showGradient
                        />
                        {/* Simple Legend */}
                        <View style={styles.legendContainer}>
                            {pieData.map((item: any, index: number) => (
                                <View key={index} style={styles.legendItem}>
                                    <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                                    <Text variant="bodySmall" style={{ marginLeft: 5 }}>{item.legend || 'Other'} ({Math.round(item.value)})</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ) : (
                    <Text>No expenses recorded yet.</Text>
                )}
            </View>

            <View style={styles.chartSection}>
                <Text variant="titleMedium" style={styles.chartTitle}>Spending Trend (Last 7 Days)</Text>
                <View style={[styles.chartWrapper, { paddingRight: 20 }]}>
                    <LineChart
                        data={lineData}
                        color={theme.colors.primary}
                        thickness={3}
                        dataPointsColor={theme.colors.secondary}
                        width={300}
                        noOfSections={3}
                        maxValue={Math.max(...lineData.map(d => d.value), 10)}
                    />
                </View>
            </View>

            <View style={{ height: 50 }} />
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        marginBottom: 10,
    },
    greeting: {
        fontWeight: 'bold',
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        marginBottom: 5,
    },
    chartSection: {
        margin: 15,
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 10,
        elevation: 2,
        alignItems: 'center',
    },
    chartTitle: {
        alignSelf: 'flex-start',
        marginBottom: 15,
        fontWeight: 'bold',
    },
    chartWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 15,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        marginBottom: 5,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
    }
});
