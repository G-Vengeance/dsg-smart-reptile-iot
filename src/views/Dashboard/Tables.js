import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Flex, Text, Box, Button } from "@chakra-ui/react";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardBody from "components/Card/CardBody.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, zoomPlugin);

const Tables = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Temperature",
        data: [],
        borderColor: "#ff6384",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
      {
        label: "Humidity",
        data: [],
        borderColor: "#36a2eb",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
    ],
  });

  const fetchData = async () => {
    try {
      const response = await fetch("https://api.thingspeak.com/channels/2831347/feeds.json?results=1000");
      const data = await response.json();
      const feeds = data.feeds;

      const labels = feeds.map((feed) => new Date(feed.created_at).toLocaleString());
      const temperatureData = feeds.map((feed) => parseFloat(feed.field1) || 0);
      const humidityData = feeds.map((feed) => parseFloat(feed.field2) || 0);

      setChartData({
        labels,
        datasets: [
          { ...chartData.datasets[0], data: temperatureData },
          { ...chartData.datasets[1], data: humidityData },
        ],
      });
    } catch (error) {
      console.error("Error fetching data from ThingSpeak:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 120000); // Update every 2 minutes
    return () => clearInterval(interval);
  }, []);

  const exportToXML = () => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<data>`;
    chartData.labels.forEach((label, index) => {
      xml += `\n  <entry>`;
      xml += `\n    <date>${label}</date>`;
      xml += `\n    <temperature>${chartData.datasets[0].data[index]}</temperature>`;
      xml += `\n    <humidity>${chartData.datasets[1].data[index]}</humidity>`;
      xml += `\n  </entry>`;
    });
    xml += "\n</data>";

    const blob = new Blob([xml], { type: "application/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "log_dsg_" + new Date().toISOString().split('T')[0] + ".xml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = () => {
    let csv = "Date,Temperature,Humidity\n";
    chartData.labels.forEach((label, index) => {
      csv += `${label},${chartData.datasets[0].data[index]},${chartData.datasets[1].data[index]}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "log_dsg_" + new Date().toISOString().split('T')[0] + ".csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Flex direction='column' pt={{ base: "120px", md: "75px" }}>
      <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb='0px'>
        <CardHeader p='6px 0px 22px 0px' display='flex' alignItems='center'>
          <Text fontSize='lg' color='#fff' fontWeight='bold'>
            Log Data Temperature & Humidity
          </Text>
          <Button colorScheme='teal' size='sm' onClick={exportToCSV} ml={4}>Export to CSV</Button>
          <Button colorScheme='blue' size='sm' onClick={exportToXML} ml={2}>Export to XML</Button>
        </CardHeader>
        <CardBody>
          <Box width='100%' height='600px'>
            <Line 
              data={chartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                scales: {
                  y: {
                    min: -50,
                    max: 100,
                    ticks: {
                      stepSize: 10
                    }
                  }
                },
                plugins: {
                  zoom: {
                    pan: {
                      enabled: true,
                      mode: "x",
                    },
                    zoom: {
                      wheel: {
                        enabled: true,
                      },
                      pinch: {
                        enabled: true,
                      },
                      mode: "x",
                    },
                  },
                }
              }} 
            />
          </Box>
        </CardBody>
      </Card>
    </Flex>
  );
};

export default Tables;
