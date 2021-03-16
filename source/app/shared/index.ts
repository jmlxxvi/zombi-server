import path from "path";
import fs from "fs";

export const modules_list = function (dirPath: string, arrayOfFiles: string[]) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = modules_list(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    const list_without_full_path = arrayOfFiles.map(file => file.replace(path.join(__dirname, "../../../api/"), ""));

    const list_without_extensions = list_without_full_path.map(file => file.replace(/\.[^/.]+$/, ""));

    return list_without_extensions.sort();

};

