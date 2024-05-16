import {createApp} from 'vue'
import {createRouter, createWebHistory} from "vue-router";
import YoutubeIframe from '@techassi/vue-youtube-iframe';

import App from './App.vue'
import RoomDetail from "@/components/RoomDetail.vue";
import ChatRoom from "@/components/RoomList.vue";
import RoomSettings from '@/components/RoomSettings.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { name: 'room',  path: '/rooms/:roomCode', component: RoomDetail },
        { name: 'rooms', path: '/rooms', component: ChatRoom },
        { name: 'roomSettings', path: '/rooms/new', component: RoomSettings },
    ]
});
createApp(App).use(router).use(YoutubeIframe)
    .mount('#app');
