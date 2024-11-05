import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import axios from "axios";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNPickerSelect from "react-native-picker-select";
import { EXPO_PUBLIC_API_KEY, EXPO_PUBLIC_API_URL } from "@env";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const ufs = [
  { label: "Acre", value: "AC" },
  { label: "Alagoas", value: "AL" },
  { label: "Amapá", value: "AP" },
  { label: "Amazonas", value: "AM" },
  { label: "Bahia", value: "BA" },
  { label: "Ceará", value: "CE" },
  { label: "Distrito Federal", value: "DF" },
  { label: "Espírito Santo", value: "ES" },
  { label: "Goiás", value: "GO" },
  { label: "Maranhão", value: "MA" },
  { label: "Mato Grosso", value: "MT" },
  { label: "Mato Grosso do Sul", value: "MS" },
  { label: "Minas Gerais", value: "MG" },
  { label: "Pará", value: "PA" },
  { label: "Paraíba", value: "PB" },
  { label: "Paraná", value: "PR" },
  { label: "Pernambuco", value: "PE" },
  { label: "Piauí", value: "PI" },
  { label: "Rio de Janeiro", value: "RJ" },
  { label: "Rio Grande do Norte", value: "RN" },
  { label: "Rio Grande do Sul", value: "RS" },
  { label: "Rondônia", value: "RO" },
  { label: "Roraima", value: "RR" },
  { label: "Santa Catarina", value: "SC" },
  { label: "São Paulo", value: "SP" },
  { label: "Sergipe", value: "SE" },
  { label: "Tocantins", value: "TO" },
];

export default function Home() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUF, setSelectedUF] = useState(null);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [isNight, setIsNight] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    loadInitialLocation();
  }, []);

  const loadInitialLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        fetchWeatherByCoords(
          location.coords.latitude,
          location.coords.longitude
        );
      } else {
        const lastLocation = await AsyncStorage.getItem("lastLocation");
        if (lastLocation) {
          const { uf, city } = JSON.parse(lastLocation);
          setSelectedUF(uf);
          setSelectedCity(city);
          fetchWeatherByCity(uf, city);
        }
      }
    } catch (error) {
      console.error("Error loading initial location:", error);
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const response = await axios.get(`${EXPO_PUBLIC_API_URL}/weather`, {
        params: {
          key: EXPO_PUBLIC_API_KEY,
          lat,
          lon,
          user_ip: "remote",
        },
      });
      setWeatherData(response.data.results);
      setIsNight(response.data.results.currently === "noite");
      setCurrentLocation(response.data.results.city);
      const cityData = {
        uf: response.data.results.city.split(", ")[1],
        city: response.data.results.city_name,
      };
      await AsyncStorage.setItem("lastLocation", JSON.stringify(cityData));
    } catch (error) {
      console.error("Error fetching weather by coordinates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitiesByUF = async (uf) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://brasilapi.com.br/api/ibge/municipios/v1/${uf}?providers=dados-abertos-br,gov,wikipedia`
      );
      setCities(
        response.data.map((city) => ({ label: city.nome, value: city.nome }))
      );
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (uf = selectedUF, city = selectedCity) => {
    if (uf && city) {
      try {
        setLoading(true);
        const locationParam = `${city},${uf}`;
        const response = await axios.get(`${EXPO_PUBLIC_API_URL}/weather`, {
          params: {
            key: EXPO_PUBLIC_API_KEY,
            city_name: locationParam,
          },
        });
        setWeatherData(response.data.results);
        setIsNight(response.data.results.currently === "noite");
        setCurrentLocation(`${city}, ${uf}`);
        const cityData = { uf, city };
        await AsyncStorage.setItem("lastLocation", JSON.stringify(cityData));
      } catch (error) {
        console.error("Error fetching weather by city:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderWeatherIcon = (condition, size = 100) => {
    const color = isNight ? "#FFD700" : "#FFD700";
    switch (condition) {
      case "clear_day":
        return <Icon name="weather-sunny" size={size} color={color} />;
      case "rain":
        return <Icon name="weather-pouring" size={size} color="#FFFFFF" />;
      case "cloud":
        return <Icon name="weather-cloudy" size={size} color="#FFFFFF" />;
      case "clear_night":
        return <Icon name="weather-night" size={size} color="#FFFFFF" />;
      default:
        return (
          <Icon name="weather-partly-cloudy" size={size} color="#FFFFFF" />
        );
    }
  };

  useEffect(() => {
    if (selectedUF) {
      fetchCitiesByUF(selectedUF);
    }
  }, [selectedUF]);

  useEffect(() => {
    if (selectedUF && selectedCity) {
      fetchWeatherByCity();
      setIsSelectingLocation(false);
    }
  }, [selectedUF, selectedCity]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: "#1E90FF" }]}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isNight ? "#1F2937" : "#1E90FF" },
      ]}
    >
      <View style={styles.locationBar}>
        <TouchableOpacity
          style={styles.locationSelect}
          onPress={() => setIsSelectingLocation(!isSelectingLocation)}
        >
          <Icon name="map-marker" size={24} color="#FFFFFF" />
          <Text style={styles.locationText}>
            {currentLocation || "Carregando..."}
          </Text>
          <Icon name="chevron-down" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Icon name="bell-outline" size={24} color="#FFFFFF" />
      </View>

      {isSelectingLocation && (
        <View style={styles.locationPickers}>
          <View style={styles.pickerContainer}>
            <RNPickerSelect
              onValueChange={(value) => {
                setSelectedUF(value);
                setSelectedCity("");
              }}
              items={ufs}
              placeholder={{ label: "Selecione o estado", value: null }}
              style={pickerSelectStyles}
              value={selectedUF}
            />
          </View>

          {selectedUF && (
            <View style={styles.pickerContainer}>
              <RNPickerSelect
                onValueChange={setSelectedCity}
                items={cities}
                placeholder={{ label: "Selecione a cidade", value: null }}
                style={pickerSelectStyles}
                value={selectedCity}
              />
            </View>
          )}
        </View>
      )}

      {weatherData && (
        <View style={styles.weatherContainer}>
          <View style={styles.mainWeather}>
            {renderWeatherIcon(weatherData.condition_slug)}
            <Text style={styles.tempText}>{weatherData.temp}°</Text>
            <Text style={styles.description}>Precipitations</Text>
            <Text style={styles.minMaxText}>
              Max: {weatherData.forecast[0].max}° Min:{" "}
              {weatherData.forecast[0].min}°
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Icon name="water-percent" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{weatherData.humidity}%</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="weather-windy" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>{weatherData.wind_speedy}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="speedometer" size={24} color="#FFFFFF" />
              <Text style={styles.statValue}>
                {weatherData.forecast[0].rain_probability}%
              </Text>
            </View>
          </View>

          <View style={styles.hourlyContainer}>
            <Text style={styles.sectionTitle}>Today</Text>
            <View style={styles.hourlyList}>
              {["15:00", "16:00", "17:00", "18:00"].map((hour, index) => (
                <View key={hour} style={styles.hourlyItem}>
                  <Text style={styles.hourText}>{hour}</Text>
                  {renderWeatherIcon(weatherData.condition_slug, 30)}
                  <Text style={styles.hourTemp}>
                    {weatherData.forecast[0].max - index}°
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.forecastContainer}>
            <Text style={styles.sectionTitle}>Next Forecast</Text>
            {weatherData.forecast.map((day) => (
              <View key={day.date} style={styles.forecastItem}>
                <Text style={styles.forecastDay}>{day.weekday}</Text>
                {renderWeatherIcon(day.condition, 30)}
                <Text style={styles.forecastTemp}>
                  {day.max}° {day.min}°
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  locationBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 40,
  },
  locationSelect: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 8,
    borderRadius: 20,
  },
  locationText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginHorizontal: 8,
  },
  locationPickers: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    overflow: "hidden",
  },
  weatherContainer: {
    flex: 1,
  },
  mainWeather: {
    alignItems: "center",
    marginBottom: 30,
  },
  tempText: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginVertical: 10,
  },
  description: {
    fontSize: 20,
    color: "#FFFFFF",
    marginBottom: 5,
  },
  minMaxText: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#FFFFFF",
    marginTop: 5,
    fontSize: 16,
  },
  hourlyContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 15,
  },
  hourlyList: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 15,
  },
  hourlyItem: {
    alignItems: "center",
  },
  hourText: {
    color: "#FFFFFF",
    marginBottom: 5,
  },
  hourTemp: {
    color: "#FFFFFF",
    marginTop: 5,
  },
  forecastContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 15,
  },
  forecastItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  forecastDay: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  forecastTemp: {
    color: "#FFFFFF",
    fontSize: 16,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    color: "#333",
    paddingRight: 30,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    color: "#333",
    paddingRight: 30,
  },
});
