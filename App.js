import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

function App() {
  const [month, setMonth] = useState('03'); // Default to March
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [barChartData, setBarChartData] = useState([]);
  const [pieChartData, setPieChartData] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [month, search, page]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/transactions/combined?month=${month}&search=${search}&page=${page}`);
      setTransactions(response.data.transactions);
      setStatistics(response.data.statistics);
      setBarChartData(response.data.barChart);
      setPieChartData(response.data.pieChart);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <div className="App">
      <h1>Transaction Dashboard</h1>
      
      <select value={month} onChange={(e) => setMonth(e.target.value)}>
        {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
          <option key={m} value={m}>{new Date(2022, m - 1).toLocaleString('default', { month: 'long' })}</option>
        ))}
      </select>

      <input 
        type="text" 
        placeholder="Search transactions" 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
      />

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Price</th>
            <th>Category</th>
            <th>Sold</th>
            <th>Date of Sale</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.title}</td>
              <td>{transaction.description}</td>
              <td>{transaction.price}</td>
              <td>{transaction.category}</td>
              <td>{transaction.sold ? 'Yes' : 'No'}</td>
              <td>{new Date(transaction.dateOfSale).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>

      <div>
        <h2>Statistics</h2>
        <p>Total Sale Amount: ${statistics.totalSaleAmount}</p>
        <p>Total Sold Items: {statistics.soldItems}</p>
        <p>Total Not Sold Items: {statistics.notSoldItems}</p>
      </div>

      <div>
        <h2>Bar Chart</h2>
        <BarChart width={600} height={300} data={barChartData}>
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </div>

      <div>
        <h2>Pie Chart</h2>
        <PieChart width={400} height={400}>
          <Pie
            data={pieChartData}
            dataKey="count"
            nameKey="_id"
            cx="50%"
            cy="50%"
            outerRadius={150}
            fill="#8884d8"
            label
          >
            {pieChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </div>
    </div>
  );
}

export default App;