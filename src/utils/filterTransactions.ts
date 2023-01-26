export function filterTransactionsByDay(transactions: any[]) {
  const filteredTransactions: any = [];

  transactions.map((tran, i, arr) => {
    if (!arr[tran.transactionDate]) {
      arr[tran.transactionDate] = {
        transactionDate: tran.transactionDate,
        transactions: []
      };
      filteredTransactions.push(arr[tran.transactionDate]);
    }

    return arr[tran.transactionDate].transactions.push(tran);
  }, Object.create(null));

  return filteredTransactions;
}
