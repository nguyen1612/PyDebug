import { Client } from "./helpers/Client";

(async () => {
    const client = new Client();

    await client.init();

    // Assuming the user get all info of the current debugger
    const path = './test/test-1.py';
    const breakpoints = [{ line: 27 }];
    client.setBreakPoints(path, breakpoints);
    setTimeout(() => {
        client.next();
        setTimeout(() => {
            client.next();
            setTimeout(() => {
                client.next();
            }, 3000);
        }, 3000);
    }, 3000);
    
})();
