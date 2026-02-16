export interface WeatherUpdate {
    temperature: number;
    wind: number;
    snow?: 'No Snow' | 'Snow' | 'Heavy Snow' | string;
    rain?: 'No Rain' | 'Rain' | 'Heavy Rain' | string;
    timestamp?: string;
    location?: string;
}
