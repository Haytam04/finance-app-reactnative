import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Switch, useTheme, Divider, Text, Portal, Dialog, Button } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';

export default function SettingsScreen({ navigation }: { navigation: any }) {
    const theme = useTheme();
    const { user } = useAuth();

    const handleLogout = () => {
        signOut(getAuth());
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="titleLarge">Settings</Text>
            </View>

            <List.Section>
                <List.Subheader>General</List.Subheader>
                <List.Item
                    title="Categories"
                    left={() => <List.Icon icon="shape" />}
                    right={() => <List.Icon icon="chevron-right" />}
                    onPress={() => navigation.navigate('Categories')}
                />
                <Divider />
                <List.Item
                    title="Budgets"
                    left={() => <List.Icon icon="chart-arc" />}
                    right={() => <List.Icon icon="chevron-right" />}
                    onPress={() => navigation.navigate('Budgets')}
                />
                <Divider />
            </List.Section>

            <List.Section>
                <List.Subheader>Account</List.Subheader>
                <List.Item
                    title="Logout"
                    left={() => <List.Icon icon="logout" color={theme.colors.error} />}
                    onPress={handleLogout}
                    titleStyle={{ color: theme.colors.error }}
                />
            </List.Section>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        elevation: 2,
    },
});
