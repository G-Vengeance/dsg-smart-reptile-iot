import React, { useState, useEffect } from 'react';
import {
	Box,
	Button,
	CircularProgress,
	CircularProgressLabel,
	Flex,
	Grid,
	Icon,
	Progress,
	SimpleGrid,
	Spacer,
	Stack,
	Stat,
	StatHelpText,
	StatLabel,
	StatNumber,
	Table,
	Tbody,
	Text,
	Th,
	Thead,
	Tr
} from '@chakra-ui/react';
import medusa from 'assets/img/cardimgfree.jpg';
import ular1 from "assets/img/ular1.jpeg";
import ular2 from "assets/img/ular2.jpeg";
import ular3 from "assets/img/ular3.jpeg";
import ular4 from "assets/img/ular4.jpeg";
import Card from 'components/Card/Card.js';
import CardBody from 'components/Card/CardBody.js';
import CardHeader from 'components/Card/CardHeader.js';
import BarChart from 'components/Charts/BarChart';
import LineChart from 'components/Charts/LineChart';
import IconBox from 'components/Icons/IconBox';
import { ResponsiveContainer, Line, XAxis, YAxis, Tooltip } from 'recharts';


// Icons
import { BiHappy } from 'react-icons/bi';
import axios from "axios";
import { AiFillCheckCircle } from 'react-icons/ai';
import { CartIcon, DocumentIcon, GlobeIcon, RocketIcon, StatsIcon, WalletIcon } from 'components/Icons/Icons.js';
import DashboardTableRow from 'components/Tables/DashboardTableRow';
import TimelineRow from 'components/Tables/TimelineRow';
import { BsArrowRight } from 'react-icons/bs';
import { IoCheckmarkDoneCircleSharp, IoEllipsisHorizontal } from 'react-icons/io5';
import {
	barChartDataDashboard,
	barChartOptionsDashboard,
	lineChartDataDashboard,
	lineChartOptionsDashboard
} from 'variables/charts';
import { dashboardTableData, timelineData } from 'variables/general';

export default function Dashboard() {
	const [fan, setFan] = useState(false);
	const [pump, setPump] = useState(false);
	const [autoMode, setAutoMode] = useState(false);
	const [temperature, setTemperature] = useState(0);
	const [humidity, setHumidity] = useState(0);
	const [chartTemperature, setChartTemperature] = useState([]);
	const [chartHumidity, setChartHumidity] = useState([]);
	const [chartTimestamps, setChartTimestamps] = useState([]);
	// const API_TOKEN = "9hAHaw4XJSdpiHJr2cDT6_lEtj4-DjEC";
 	// const BASE_URL = "https://blynk.cloud/external/api";
	const FLASK_API_BASE_URL = "https://dsg-tropidoleamus-deathg.herokuapp.com"; // Ganti dengan URL Heroku Anda yang sudah benar!
	// Pastikan Anda sudah mengganti nama aplikasi Heroku Anda menjadi 'dsg-tropidoleamus-deathg'
	const DEVICE_ID = "terarium_tropidolaemus_01"; // ID unik untuk perangkat NodeMCU Anda


	  const toggleDevice = async (pin, state, setState) => {
        try {
          const newState = state ? 0 : 1; // Toggle ON/OFF
          let command = "";
          if (pin === "V1") { // V1 untuk Fan
              command = newState === 1 ? "fan_on" : "fan_off";
          } else if (pin === "V2") { // V2 untuk Pump
              command = newState === 1 ? "pump_on" : "pump_off";
          } else if (pin === "V0") { // V0 untuk Auto Mode (jika diimplementasikan di NodeMCU)
              command = newState === 1 ? "auto_on" : "auto_off";
          }

          // Mengirim perintah ke Flask API
          const response = await fetch(`${FLASK_API_BASE_URL}/api/v1/control`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  device_id: DEVICE_ID,
                  command: command,
              }),
          });
      
          if (response.ok) {
            setState(newState);
            console.log(`Command '${command}' sent successfully.`);
          } else {
            console.error(`Failed to update device:`, response.statusText);
          }
        } catch (error) {
          console.error("Error:", error);
        }
      };

useEffect(() => {
        const fetchData = async () => {
          try {
            // Ambil data terbaru dari Flask API
            const latestDataRes = await axios.get(`${FLASK_API_BASE_URL}/api/v1/latest_data/${DEVICE_ID}`);
            const historicalDataRes = await axios.get(`${FLASK_API_BASE_URL}/api/v1/historical_data/${DEVICE_ID}`); // Ambil 100 data terakhir

            setTemperature(latestDataRes.data.temperature);
            setHumidity(latestDataRes.data.humidity);
    
            const timestamps = historicalDataRes.data.map(feed => new Date(feed.timestamp).toLocaleTimeString());
            const temperatures = historicalDataRes.data.map(feed => parseFloat(feed.temperature));
            const humidities = historicalDataRes.data.map(feed => parseFloat(feed.humidity));
            
            setChartTimestamps(timestamps);
            setChartTemperature(temperatures);
            setChartHumidity(humidities);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        
        fetchData();
        const interval = setInterval(fetchData, 120000); // Masih 2 menit untuk polling
        return () => clearInterval(interval);
      }, []);
	
	  const lineChartData = chartTimestamps.map((time, index) => ({
		time,
		temperature: chartTemperature[index],
		humidity: chartHumidity[index]
	  }));

	return (
		<Flex flexDirection='column' pt={{ base: '120px', md: '75px' }}>
			<Grid templateColumns={{ sm: '1fr', md: '1fr 1fr' }} my='26px' gap='18px'>
			<Card
					p='50px'
					gridArea={{ md: '1 / 1 / 2 / 3', '2xl': 'auto' }}
					bgImage={medusa}
					bgSize='cover'
					bgPosition='50%'>
					<CardBody w='100%' h='100%'>
						<Flex flexDirection={{ sm: 'column', lg: 'row' }} w='100%' h='100%'>
							<Flex flexDirection='column' h='100%' p='22px' minW='60%' lineHeight='1.6'>
								<Text fontSize='sm' color='gray.400' fontWeight='bold'>
									Welcome back,
								</Text>
								<Text fontSize='28px' color='#fff' fontWeight='bold' mb='18px'>
									Gerrio DeathG
								</Text>
								<Text fontSize='md' color='gray.400' fontWeight='normal' mb='auto'>
									Reptile Community <br />
									Tropidoleamus SP.
								</Text>
								<Spacer />
								<Flex align='center'>
								</Flex>
							</Flex>
						</Flex>
					</CardBody>
				</Card>
				<Card>
					<CardHeader>
						<Text color='#fff' fontSize='lg' fontWeight='bold'>Temperature</Text>
					</CardHeader>
					<Flex direction='column' justify='center' align='center'>
						<CircularProgress size={200}
								value={temperature}
								thickness={6}
								color='#582CFF'
								variant='vision'
								rounded>
							<CircularProgressLabel>
								<IconBox mb='20px' mx='auto' bg='brand.200' borderRadius='50%' w='48px' h='48px'>
										<Icon as={BiHappy} color='#fff' w='30px' h='30px' />
									</IconBox>
							</CircularProgressLabel>
						</CircularProgress>
						<Text color='#fff' fontSize='28px' fontWeight='bold'>{temperature} °C</Text>
					</Flex>
				</Card>
				<Card gridArea={{ md: '2 / 2 / 3 / 3', '2xl': 'auto' }}>
					<CardHeader>
						<Text color='#fff' fontSize='lg' fontWeight='bold'>Humidity</Text>
					</CardHeader>
					<Flex direction='column' justify='center' align='center'>
						<CircularProgress size={200} value={humidity} thickness={6} color='#05CD99'>
							<CircularProgressLabel>
								<IconBox mb='20px' mx='auto' bg='#05CD99' borderRadius='50%' w='48px' h='48px'>
										<Icon as={BiHappy} color='#fff' w='30px' h='30px' />
									</IconBox>
							</CircularProgressLabel>
						</CircularProgress>
						<Text color='#fff' fontSize='28px' fontWeight='bold'>{humidity} %</Text>
					</Flex>
				</Card>
				<Card templateColumns={{ sm: '2fr', lg: '1.7fr 1.3fr' }}
				maxW={{ sm: '100%', md: '100%' }}
				gap='24px'
				mb='24px'>
					<Flex direction='column'>
						<Flex justify='space-between' align='center' mb='40px'>
							<Text color='#fff' fontSize='lg' fontWeight='bold'>
								Control Panel
							</Text>
						</Flex>
						<Flex direction={{ sm: 'column', md: 'row' }}>
							<Flex direction='column' me={{ md: '6px', lg: '52px' }} mb={{ sm: '16px', md: '0px' }}>
								<Flex
									direction='column'
									p='22px'
									pe={{ sm: '22e', md: '8px', lg: '22px' }}
									minW={{ sm: '220px', md: '140px', lg: '220px' }}
									bg='linear-gradient(126.97deg, #060C29 28.26%, rgba(4, 12, 48, 0.5) 91.2%)'
									borderRadius='20px'
									mb='20px'>
									<button 
										p='0px'
										variant='no-hover'
										bg='transparent'
										my={{ sm: '1.5rem', lg: '0px' }}
										onClick={() => toggleDevice("V1", fan, setFan)}
										style={{ background: fan ? "green" : "#22234B" }}>
										<Text color='#fff' fontSize='lg' fontWeight='bold'>
											Fan {fan ? "ON" : "OFF"}
										</Text>
									</button>
								</Flex>
								<Flex
									direction='column'
									p='22px'
									pe={{ sm: '22px', md: '8px', lg: '22px' }}
									minW={{ sm: '170px', md: '140px', lg: '170px' }}
									bg='linear-gradient(126.97deg, #060C29 28.26%, rgba(4, 12, 48, 0.5) 91.2%)'
									borderRadius='20px'>
									<button 
										p='0px'
										variant='no-hover'
										bg='transparent'
										my={{ sm: '1.5rem', lg: '0px' }}
										onClick={() => toggleDevice("V2", pump, setPump)}
										style={{ background: pump ? "green" : "#22234B" }}>
										<Text color='#fff' fontSize='lg' fontWeight='bold'>
											Pump {pump ? "ON" : "OFF"}
										</Text>
										</button>
								</Flex>
								<Flex 
									direction='column'
									p='22px'
									pe={{ sm: '22px', md: '8px', lg: '22px' }}
									minW={{ sm: '170px', md: '140px', lg: '170px' }}
									bg='linear-gradient(126.97deg, #060C29 28.26%, rgba(4, 12, 48, 0.5) 91.2%)'
									borderRadius='20px'>
									<button 
												p='0px'
												variant='no-hover'
												bg='transparent'
												my={{ sm: '1.5rem', lg: '0px' }}
												onClick={() => toggleDevice("V0", autoMode, setAutoMode)}
												style={{ background: autoMode ? "green" : "#22234B" }}>
												<Text color='#fff' fontSize='lg' fontWeight='bold'>
													Auto Mode {autoMode ? "ON" : "OFF"}
												</Text>
												</button>
								</Flex>
							</Flex>
							<Box mx={{ sm: 'auto', md: '0px' }}>
								<CircularProgress
									size={window.innerWidth >= 1024 ? 300 : window.innerWidth >= 768 ? 170 : 200}
									value={100}
									thickness={6}
									color='#52D3D8'
									variant='vision'>
									<CircularProgressLabel>
										<Flex direction='column' justify='center' align='center'>
											<Text color='gray.400' fontSize='sm'>
												Safety
											</Text>
											<Text
												color='#fff'
												fontSize={{ md: '36px', lg: '50px' }}
												fontWeight='bold'
												mb='4px'>
												10
											</Text>
											<Text color='gray.400' fontSize='sm'>
												Total Score
											</Text>
										</Flex>
									</CircularProgressLabel>
								</CircularProgress>
							</Box>
						</Flex>
					</Flex>
				</Card>
				<Card>
  <CardHeader>
    <Text fontSize='lg' color='#fff' fontWeight='bold'>Galery</Text>
  </CardHeader>
  <Box w='100%' minH={{ sm: '300px' }} display='flex' flexWrap='wrap' gap={4} p={4}>
    {[ular1, ular2, ular3, ular4].map((src, idx) => (
      <Box key={idx} width='200px' height='150px' overflow='hidden' borderRadius='md'>
        <img src={src} alt={`Image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Box>
    ))}
  </Box>
</Card>
			</Grid>
			
		</Flex>
	);
}
