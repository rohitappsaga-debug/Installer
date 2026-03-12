import Pusher from 'pusher-js';

const pusherKey = import.meta.env.VITE_PUSHER_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_CLUSTER;

if (!pusherKey || !pusherCluster) {
    console.error('Pusher configuration missing in .env file');
}

const pusher = new Pusher(pusherKey, {
    cluster: pusherCluster,
});

export default pusher;
