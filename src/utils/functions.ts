import EventEmitter from "events";

export function secondsToMinutesSeconds(seconds: number) {
    const minutes = ~~(seconds / 60);
    const extraSeconds = seconds % 60;
    return `${minutes}:${extraSeconds.toString().padStart(2, '0')}`;
}

export function millisToMinutesAndSeconds(millis: number) {
    var minutes = Math.floor(millis / 60000);
    var seconds = Number(((millis % 60000) / 1000).toFixed(0));
    return seconds == 60
        ? minutes + 1 + ":00"
        : minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

export function convertFromHex(hex: string) {
    hex = hex.toString();
    let str = '';
    for (let i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

export function convertHexStringToNumArray(h: string) {
    let i: any, j = (i = h.match(/.{2}/g)) != null ? i : [];
    return j == null ? void 0x0 : j.map((k: string) => {
        return parseInt(k, 0x10);
    });
}

export function decimalToHexString(number: number) {
    if (number < 0)
        number = 0xFFFFFFFF + number + 1;

    const hex = number.toString(16).toUpperCase();
    return hex.length == 1 ? `0${hex}` : hex;
}

export function flipHexString(hexValue: string, hexDigits: number) {
    let h = hexValue.substr(0, 2);
    for (let i = 0; i < hexDigits; ++i)
        h += hexValue.substr(2 + (hexDigits - 1 - i) * 2, 2);
    return h;
}

export function hexToFloat(hex: string) {
    const int = parseInt(hex)
    let s = int >> 31 ? -1 : 1;
    let e = int >> 23 & 255;
    return s * (int & 8388607 | 8388608) * 1.0 / Math.pow(2, 23) * Math.pow(2, (e - 127))
}

export async function getValue(service: BluetoothRemoteGATTService, characteristic: string, bytes = 4): Promise<[string, DataView]> {
    const char = await service.getCharacteristic(characteristic);
    const value = await char.readValue();

    if (bytes == 0) return [null, value]

    let str = '';
    for (let i = 0; i < bytes; i++) str += decimalToHexString(value.getUint8(i)).toString();
    const hex = flipHexString('0x' + str, 8)
    return [hex, value];
}

export async function gattPoller(service: BluetoothRemoteGATTService, characteristic: string, bytes = 4, time?: number): Promise<EventEmitter> {
    if (!time) time = 10000; // 10s
    const listener = new EventEmitter();
    const char = await service.getCharacteristic(characteristic);

    const func = async () => {
        const value = await char.readValue();
        if (bytes == 0) {
            listener.emit('data', null, value);
            listener.emit('change', null, value);
        } else {
            const str = decimalToHexString(value.getUint8(0)).toString() + decimalToHexString(value.getUint8(1)).toString() + decimalToHexString(value.getUint8(2)).toString() + decimalToHexString(value.getUint8(3)).toString();
            const hex = flipHexString('0x' + str, 8)
            listener.emit('data', hex, value);
            if (hex != lastValue) listener.emit('change', hex, value);
            lastValue = hex;
        }
    }

    let lastValue: string;
    func();
    const int = setInterval(func, time);

    listener.on('stop', () => {
        listener.removeAllListeners();
        clearInterval(int)
    });

    return listener;
}