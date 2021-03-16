const codes: {
    [key: number]: string
} = {
    1000: "Not authorized",
    1001: "Invalid token/Session expired",
    1002: "Invalid response from action function {1}/{2}",
    1003: "Cannot execute {1}",
    1004: "Cannot login",
    1005: "Invalid language",
    1006: "Cannot delete SYSTEM user",
    1007: "Cannot disable SYSTEM user",
    1008: "Cannot delete ADMIN group",
    1009: "Cannot add ADMIN group to module permissions",
    1010: "Email not found",
    1011: "Password recovery token expired",
    1012: "Request timed out",
    1013: "Invalid parameters"
};

export default (...args: [number, ...string[]]) => {

    let message = codes[args[0]];

    if (message) {

        for(let i = 1; i < args.length; i++) {

            message = message.split("{" + i + "}").join(args[i] as string);

        }

    } else {

        return `Message not found for code ${args[0]}`;

    }

    return message;

};



