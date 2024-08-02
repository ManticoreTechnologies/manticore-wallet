import axios from "axios";

export const fetchEvrToUsdtRate = async () => {
    try {
        const response = await axios.get('https://api.xeggex.com/api/v2/ticker/evr_usdt');
        return parseFloat(response.data.last_price)
    } catch (error) {
        throw error
    }
};

export const fetchEvrToBtcRate = async () => {
    try {
        const response = await axios.get('https://api.xeggex.com/api/v2/ticker/evr_btc');
        return parseFloat(response.data.last_price);
    } catch (error) {
        throw error; 
    }
};