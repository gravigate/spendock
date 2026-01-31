import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Platform, 
  StatusBar, 
  TouchableOpacity,
  TextInput,    
  FlatList      
} from 'react-native';
import { DayItem } from "./src/components/DayItem";
import { Transaction } from "./src/types";
import { generateYearDays } from "./src/utils/transactions";
import { Wallet, Search, X } from "lucide-react-native"; 
import AsyncStorage from "@react-native-async-storage/async-storage";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },

  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 4, 
    shadowColor: '#000', 

    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },

todayButton: {
    backgroundColor: '#eff6ff', 
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  todayButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },

searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f9fafb',
  marginHorizontal: 16,
  marginVertical: 8,
  paddingHorizontal: 12,
  height: 45,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

searchSummary: {
  backgroundColor: 'white',
  padding: 20,
  marginHorizontal: 16,
  marginTop: 8,
  marginBottom: 16,
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#e5e7eb',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
},
summaryLabel: {
  fontSize: 14,
  color: '#6b7280',
  marginBottom: 4,
},
summaryValue: {
  fontSize: 28,
  fontWeight: '800',
},
summaryCount: {
  fontSize: 12,
  color: '#9ca3af',
  marginTop: 8,
},

  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  resultDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  resultAmount: {
    fontSize: 16,
    fontWeight: '700',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  listContainer: {
    paddingBottom: 20,
  },

rangeContainer: {
  backgroundColor: 'white',
  marginHorizontal: 16,
  padding: 12,
  borderRadius: 12,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: '#e5e7eb',
},
rangePicker: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 4,
},
rangeLabel: {
  width: 45,
  fontSize: 12,
  fontWeight: '700',
  color: '#4b5563',
},
miniChip: {
  paddingHorizontal: 10,
  paddingVertical: 5,
  backgroundColor: '#f3f4f6',
  borderRadius: 15,
  marginRight: 6,
},
chipActive: {
  backgroundColor: '#2563eb',
},
miniText: {
  fontSize: 11,
  color: '#6b7280',
},
textActive: {
  color: 'white',
},

iconButton: {
  padding: 8,
  borderRadius: 8,
  backgroundColor: '#f3f4f6',
},
searchBackground: {
  backgroundColor: 'white',
  borderBottomWidth: 1,
  borderBottomColor: '#e5e7eb',
  paddingBottom: 8,
},

});

const getTransactionsForDate = (date: Date, allTransactions: Transaction[]) => {
  const dateString = date.toDateString();
  const dayList = new Map<string, Transaction>();

  allTransactions.forEach(t => {
    const startDate = new Date(t.date);
    if (t.endDate && date > new Date(t.endDate)) return;
    if (date < startDate) return;

    let isMatch = false;
    const isSameDay = dateString === startDate.toDateString();

    if (t.recurring === 'once') isMatch = isSameDay;
    else if (t.recurring === 'daily') isMatch = true;
    else if (t.recurring === 'weekly') isMatch = date.getDay() === startDate.getDay();
    else if (t.recurring === 'monthly') {
      const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const startDay = startDate.getDate();
      isMatch = (date.getDate() === startDay) || (startDay > lastDayOfMonth && date.getDate() === lastDayOfMonth);
    }
    else if (t.recurring === 'yearly') isMatch = (date.getDate() === startDate.getDate() && date.getMonth() === startDate.getMonth());

    if (isMatch) {
      const masterId = t.parentId || t.id;
      const key = `${masterId}-${dateString}`;
      const existing = dayList.get(key);

      if (t.isHidden || existing?.isHidden) {
        dayList.set(key, { ...t, isHidden: true });
      } else if (t.isException) {
        dayList.set(key, t);
      } else if (!dayList.has(key)) {
        dayList.set(key, { ...t, date: date.toISOString() });
      }
    }
  });

  return Array.from(dayList.values()).filter(t => !t.isHidden);
};

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [dayPositions, setDayPositions] = useState<{[key: string]: number}>({});
  const [days] = useState(() => generateYearDays(2026));
  const scrollRef = useRef<ScrollView>(null);
  const [startMonth, setStartMonth] = useState<number | null>(null); 
  const [endMonth, setEndMonth] = useState<number | null>(null);     
  const [isSearchVisible, setIsSearchVisible] = useState(false);

const searchResults = useMemo(() => {
  if (!searchQuery) return [];

  const results: Transaction[] = [];
  const query = searchQuery.toLowerCase();

  days.forEach(day => {
    const dayTransactions = getTransactionsForDate(day, transactions);
    const tMonth = day.getMonth();

    let matchesRange = true;
    if (startMonth !== null && endMonth !== null) {
      matchesRange = tMonth >= startMonth && tMonth <= endMonth;
    } else if (startMonth !== null) {
      matchesRange = tMonth >= startMonth;
    } else if (endMonth !== null) {
      matchesRange = tMonth <= endMonth;
    }

    if (matchesRange) {
      dayTransactions.forEach(t => {
        const matchesText = t.name.toLowerCase().includes(query) || 
                            t.amount.toString().includes(query);
        
        if (matchesText) {
          results.push(t);
        }
      });
    }
  });

  return results;
}, [searchQuery, transactions, days, startMonth, endMonth]);

  const searchTotal = searchResults.reduce((acc, t) => {
  return t.type === 'incoming' ? acc + t.amount : acc - t.amount;
}, 0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedData = await AsyncStorage.getItem("transactions");
        if (savedData) setTransactions(JSON.parse(savedData));
      } catch (e) { console.error("Load error:", e); }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem("transactions", JSON.stringify(transactions));
      } catch (e) { console.error("Save error:", e); }
    };
    saveData();
  }, [transactions]);

useEffect(() => {
  if (Object.keys(dayPositions).length > 0 && !hasScrolled) {
    jumpToToday();
    setHasScrolled(true);
  }
}, [dayPositions, hasScrolled]);

  const handleDayLayout = (dateString: string, y: number) => {
    setDayPositions(prev => ({ ...prev, [dateString]: y }));
  };

  const jumpToToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = Object.entries(dayPositions).find(([key]) => key.startsWith(todayStr));
    if (todayEntry) {
      scrollRef.current?.scrollTo({ y: todayEntry[1] - 10, animated: true });
    }
  };

  const handleAddTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(36).substring(7),
    };
    setTransactions([...transactions, newTransaction]);
  };

  const handleEditTransaction = (id: string, updated: Omit<Transaction, "id">, mode: 'single' | 'future') => {
    const original = transactions.find(t => t.id === id);
    const targetId = original?.parentId || id;

    if (mode === 'single') {
      const newInd = { ...updated, id: Math.random().toString(36).substring(7), recurring: 'once', isException: true, parentId: undefined };
      const marker = { id: Math.random().toString(36).substring(7), date: updated.date, name: "HIDDEN", amount: 0, type: updated.type, recurring: 'once', isException: true, parentId: targetId, isHidden: true };
      setTransactions([...transactions, marker as Transaction, newInd as Transaction]);
    } else {
      setTransactions(prev => prev.map(t => (t.id === targetId ? { ...t, ...updated } : t)));
    }
  };

  const handleDeleteTransaction = (id: string, date: Date, mode: 'single' | 'future') => {
    const clicked = transactions.find(t => t.id === id);
    const masterId = clicked?.parentId || id;

    if (mode === 'future') {
      setTransactions(prev => prev.map(t => {
        if (t.id === masterId) {
          const end = new Date(date);
          end.setDate(end.getDate() - 1);
          return { ...t, endDate: end.toISOString() };
        }
        return t;
      }));
    } else {
      const cancel = { id: Math.random().toString(36).substring(7), date: date.toISOString(), name: "DELETED", amount: 0, type: 'outgoing', recurring: 'once', isException: true, parentId: masterId, isHidden: true };
      setTransactions(prev => [...prev, cancel as Transaction]);
    }
  };

  const scrollToDay = (y: number) => scrollRef.current?.scrollTo({ y, animated: true });

return (
  <View style={styles.container}>
  <StatusBar barStyle="dark-content" backgroundColor="white" translucent={true} />
   
    {Platform.OS === 'android' && (
      <View style={{ height: StatusBar.currentHeight, backgroundColor: 'white' }} />
    )}

    <View style={styles.headerContent}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Wallet size={32} color="#2563eb" />
        <View>
          <Text style={styles.title}>Spendock</Text>
          <Text style={styles.subtitle}>2026</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TouchableOpacity
          onPress={() => {
            setIsSearchVisible(!isSearchVisible);
            if (isSearchVisible) {
              setSearchQuery('');
              setStartMonth(null);
              setEndMonth(null);
            }
          }}
          style={styles.iconButton}
        >
          <Search size={24} color={isSearchVisible ? "#2563eb" : "#6b7280"} />
        </TouchableOpacity>

        <TouchableOpacity onPress={jumpToToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>
    </View>

    {/* SEARCH SECTION - Only visible if isSearchVisible is true */}
    {isSearchVisible && (
      <View style={styles.searchBackground}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name or amount..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Range Pickers moved inside the conditional block */}
        <View style={styles.rangeContainer}>
          <View style={styles.rangePicker}>
            <Text style={styles.rangeLabel}>From:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                <TouchableOpacity
                  key={`start-${m}`}
                  onPress={() => setStartMonth(startMonth === i ? null : i)}
                  style={[styles.miniChip, startMonth === i && styles.chipActive]}
                >
                  <Text style={[styles.miniText, startMonth === i && styles.textActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.rangePicker}>
            <Text style={styles.rangeLabel}>To:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                <TouchableOpacity
                  key={`end-${m}`}
                  onPress={() => setEndMonth(endMonth === i ? null : i)}
                  style={[styles.miniChip, endMonth === i && styles.chipActive]}
                >
                  <Text style={[styles.miniText, endMonth === i && styles.textActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>
    )}

    {searchQuery.length > 0 ? (
      <FlatList
        data={searchResults}
        keyExtractor={(item, index) => `${item.id}-${item.date}-${index}`}
        style={styles.scrollView}
        ListHeaderComponent={() => (
          <View style={styles.searchSummary}>
            <Text style={styles.summaryLabel}>Total for "{searchQuery}"</Text>
            <Text style={[
              styles.summaryValue,
              { color: searchTotal >= 0 ? '#16a34a' : '#dc2626' }
            ]}>
              {searchTotal >= 0 ? '' : '-'}£{Math.abs(searchTotal).toFixed(2)}
            </Text>
            <Text style={styles.summaryCount}>{searchResults.length} transactions found</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.searchResultItem}
            onPress={() => {
              const targetDate = new Date(item.date).toDateString();
              const matchingKey = Object.keys(dayPositions).find(key =>
                new Date(key).toDateString() === targetDate
              );
              const yPosition = matchingKey ? dayPositions[matchingKey] : undefined;

              setSearchQuery('');
              setIsSearchVisible(false);

              if (yPosition !== undefined) {
                setTimeout(() => {
                  scrollRef.current?.scrollTo({
                    y: yPosition - 10,
                    animated: true
                  });
                }, 150);
              }
            }}
          >
            <View>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultDate}>
                {new Date(item.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </Text>
            </View>
            <Text style={[
              styles.resultAmount,
              { color: item.type === 'incoming' ? '#16a34a' : '#dc2626' }
            ]}>
              {item.type === 'incoming' ? '+' : '-'}£{Math.abs(item.amount).toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      />
    ) : (
      <ScrollView ref={scrollRef} style={styles.scrollView}>
        <View style={styles.listContainer}>
          {(() => {
            let runningTotal = 0;
            return days.map((day) => {
              const dayTransactions = getTransactionsForDate(day, transactions);
              const dayNetChange = dayTransactions.reduce((acc, t) => t.type === 'incoming' ? acc + t.amount : acc - t.amount, 0);
              runningTotal += dayNetChange;
              return (
                <DayItem
                  key={day.toISOString()}
                  date={day}
                  balance={runningTotal}
                  transactions={dayTransactions}
                  onExpand={scrollToDay}
                  onLayoutReady={(y) => handleDayLayout(day.toISOString(), y)}
                  onAddTransaction={handleAddTransaction}
                  onEditTransaction={handleEditTransaction}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              );
            });
          })()}
        </View>
      </ScrollView>
    )}
  </View>
);}