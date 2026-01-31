import { useState, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  Alert 
} from "react-native";
import { ChevronDown, ChevronRight, Plus, Edit2 } from "lucide-react-native";
import { TransactionForm } from "./TransactionForm";
import { Transaction } from "../types";
import { Wallet } from "lucide-react-native";

interface DayItemProps {
  date: Date;
  balance: number;
  transactions: Transaction[];
  onExpand: (y: number) => void;
  onLayoutReady: (y: number) => void; // <--- ADD THIS LINE
  onAddTransaction: (transaction: Omit<Transaction, "id">) => void;
  onEditTransaction: (
    transactionId: string,
    transaction: Omit<Transaction, "id">, 
    mode: 'single' | 'future') => void;
  onDeleteTransaction: (
  transactionId: string, 
  date: Date, 
  mode: 'single' | 'future'
) => void;
}

export function DayItem({
  date,
  balance,
  transactions,
  onExpand,
  onLayoutReady,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: DayItemProps) {
  const containerRef = useRef<View>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [layoutY, setLayoutY] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- EDIT WRAPPER ---
  const handleSaveEdit = (updated: Omit<Transaction, "id">) => {
    if (updated.recurring === 'once') {
      onEditTransaction(editingId!, updated, 'single');
      setEditingId(null);
      return;
    }

    Alert.alert(
      "Edit Recurring Transaction",
      "Do you want to change only this instance or all future transactions?",
      [
        { 
          text: "Just This One", 
          onPress: () => {
            onEditTransaction(editingId!, updated, 'single');
            setEditingId(null);
          }
        },
        { 
          text: "All Future", 
          onPress: () => {
            onEditTransaction(editingId!, updated, 'future');
            setEditingId(null);
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const confirmDelete = (transaction: Transaction) => {
    if (transaction.recurring === 'once' || (transaction.isException && !transaction.parentId)) {
      onDeleteTransaction(transaction.id, date, 'single');
      return;
    }

    Alert.alert(
      "Delete Recurring Transaction",
      "Do you want to delete only this instance or the entire series?",
      [
        { 
          text: "Just This One", 
          onPress: () => onDeleteTransaction(transaction.id, date, 'single') 
        },
        { 
          text: "All Future", 
          onPress: () => onDeleteTransaction(transaction.id, date, 'future'),
          style: "destructive"
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const handleToggleExpand = () => {
    const nextState = !isExpanded;
    setIsExpanded(nextState);
    
    if (nextState && onExpand) {
      containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
        onExpand(y);
      });
    }
  };

  const dayTransactions = transactions.filter((t) => {
    const transDate = new Date(t.date);
    return (
      transDate.getDate() === date.getDate() &&
      transDate.getMonth() === date.getMonth() &&
      transDate.getFullYear() === date.getFullYear()
    );
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayOfWeek = days[date.getDay()];
  const monthDay = `${months[date.getMonth()]} ${date.getDate()}`;
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <View 
      ref={containerRef} 
      style={styles.container}
      onLayout={(event) => {
        onLayoutReady?.(event.nativeEvent.layout.y); 
      }}
    >
      {/* Main Row */}
      <TouchableOpacity
        onPress={handleToggleExpand}
        style={[styles.row, isToday && styles.todayBackground]}
        activeOpacity={0.7}
      >
        <View style={styles.leftSection}>
          {isExpanded ? (
            <ChevronDown size={20} color="#6b7280" />
          ) : (
            <ChevronRight size={20} color="#6b7280" />
          )}
          <View style={styles.dateInfo}>
            <Text style={styles.dayOfWeek}>{dayOfWeek}</Text>
            <Text style={styles.monthDay}>{monthDay}</Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.label}>Available</Text>
          <Text style={[
            styles.balance,
            { color: balance >= 0 ? "#16a34a" : "#dc2626" }
          ]}>
            £{balance.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {dayTransactions.map((transaction) => {
            if (editingId === transaction.id) {
              return (
                <TransactionForm
                  key={transaction.id}
                  date={date}
                  initialData={transaction}
                  onSubmit={(updated) => {
                    handleSaveEdit(updated as any);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.flex1}>
                  <Text style={styles.transName}>{transaction.name}</Text>
                  {transaction.recurring !== "once" && (
                    <Text style={styles.transSub}>Repeats {transaction.recurring}</Text>
                  )}
                </View>
                
                <View style={styles.transRight}>
                  <Text style={[
                    styles.transAmount,
                    { color: transaction.type === "incoming" ? "#16a34a" : "#dc2626" }
                  ]}>
                    {transaction.type === "incoming" ? "+" : "-"}£{Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => setEditingId(transaction.id)} style={styles.iconButton}>
                      <Edit2 size={16} color="#9ca3af" />
                    </TouchableOpacity>
                    
                    {/* UPDATED DELETE BUTTON CALL */}
                    <TouchableOpacity onPress={() => confirmDelete(transaction)} style={styles.iconButton}>
                      <Text style={styles.deleteText}>×</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          {showForm ? (
            <TransactionForm
              date={date}
              onSubmit={(t) => {
                onAddTransaction(t);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          ) : (
            <TouchableOpacity 
              onPress={() => setShowForm(true)} 
              style={styles.addButton}
            >
              <Plus size={18} color="#2563eb" style={{ marginRight: 8 }} />
              <Text style={styles.addButtonText}>Add Transaction</Text>
            </TouchableOpacity>
)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "white",
  },
  row: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  todayBackground: {
    backgroundColor: "#eff6ff",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateInfo: {
    marginLeft: 8,
  },
  dayOfWeek: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  monthDay: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
  },
  balance: {
    fontSize: 16,
    fontWeight: "700",
  },
  expandedContent: {
    backgroundColor: "#f9fafb",
    padding: 12,
    gap: 8,
  },
  transactionCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1 },
      android: { elevation: 2 },
    }),
  },
  flex1: { flex: 1 },
  transName: { fontSize: 14, fontWeight: "500" },
  transSub: { fontSize: 11, color: "#9ca3af" },
  transRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  transAmount: { fontWeight: "600" },
  actionButtons: { flexDirection: "row", gap: 4 },
  iconButton: { padding: 4 },
  deleteText: { fontSize: 20, color: "#9ca3af", lineHeight: 22 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    marginTop: 4,
  },
  addButtonText: {
    color: "#2563eb",
    fontWeight: "600",
  },
});