import { Client } from "./helpers/Client";

(async () => {
    const client = new Client();

    await client.init();

    // Assuming the user get all info of the current debugger
    const path = './test/test-1.py';
    const breakpoints = [{ line: 27 }];
    let data = <any>await client.setBreakPoints(path, breakpoints);
    console.log(data.frames);

    data = await client.next();
    console.log(data.frames);

    data = await client.next();
    console.log(data.frames);

    await client.destroy();
})();