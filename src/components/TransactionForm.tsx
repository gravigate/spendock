import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Platform,
  KeyboardAvoidingView, 
  ScrollView, 
  TouchableWithoutFeedback, 
  Keyboard 
} from "react-native";
import { Transaction } from "../types";

interface TransactionFormProps {
  date: Date;
  initialData?: Transaction;
  onSubmit: (transaction: Omit<Transaction, "id">) => void;
  onCancel: () => void;
}

export function TransactionForm({ date, initialData, onSubmit, onCancel }: TransactionFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [amount, setAmount] = useState(initialData?.amount.toString() || "");
  const [type, setType] = useState<"incoming" | "outgoing">(initialData?.type || "outgoing");
  const [recurring, setRecurring] = useState<"once" | "daily" | "weekly" | "monthly" | "yearly">(
    initialData?.recurring || "once"
  );

  const handleSubmit = () => {
    if (!name.trim() || !amount) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      name: name.trim(),
      amount: parsedAmount,
      type,
      recurring,
      date: initialData ? initialData.date : date.toISOString(),
    });
  };

  return (
    <KeyboardAvoidingView 
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Transaction Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Groceries, Salary"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Amount Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount (£)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Type Toggle */}
          <Text style={styles.label}>Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity 
              style={[styles.toggleBtn, type === 'outgoing' && styles.toggleBtnActive]} 
              onPress={() => setType('outgoing')}
            >
              <Text style={[styles.toggleText, type === 'outgoing' && styles.toggleTextActive]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, type === 'incoming' && styles.toggleBtnActive]} 
              onPress={() => setType('incoming')}
            >
              <Text style={[styles.toggleText, type === 'incoming' && styles.toggleTextActive]}>Income</Text>
            </TouchableOpacity>
          </View>

          {/* Recurrence Selection */}
          <Text style={styles.label}>Recurrence</Text>
          <View style={styles.recurringGrid}>
            {['once', 'daily', 'weekly', 'monthly', 'yearly'].map((option) => (
              <TouchableOpacity 
                key={option}
                style={[styles.chip, recurring === option && styles.chipActive]}
                onPress={() => setRecurring(option as any)}
              >
                <Text style={[styles.chipText, recurring === option && styles.chipTextActive]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions - Now correctly inside the container */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
              <Text style={styles.submitBtnText}>
                {initialData ? "Update" : "Add"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    paddingBottom: 100,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#111827',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  toggleText: {
    color: '#374151',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: 'white',
  },
  recurringGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  chipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  chipText: {
    fontSize: 12,
    color: '#4b5563',
  },
  chipTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  submitBtn: {
    flex: 2,
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#4b5563',
    fontWeight: '500',
  },
});