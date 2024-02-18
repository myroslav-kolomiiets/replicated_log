function logger(data, isError) {
    const timestamp = new Date().toLocaleString();

    if (isError) {
        console.log("\x1b[31m", `[${timestamp}] - ${data}`);
    } else {
        console.log("\x1b[32m", `[${timestamp}] - ${data}`);
    }
}

module.exports = {
    logger,
};
