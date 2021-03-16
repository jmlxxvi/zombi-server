export const normalizeProvince = (province: string): string => {
    const keyWords = ["Provincia de", "Provincia", "Province"];

    let normal = province;

    keyWords.map(word => {
        const replacer = new RegExp(word, "g");
        normal = normal.replace(replacer, "");
    }); 

    return normal.trim();
};
