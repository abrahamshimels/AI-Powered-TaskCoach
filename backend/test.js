const now = new Date();
console.log(now); // e.g., 2025-11-18T15:30:45.123Z
import {
    getTasksService,
} from "./src/services/task.service.js";

const test = async () => {
    const tasks = await getTasksService();
    console.log(tasks);
}

test();