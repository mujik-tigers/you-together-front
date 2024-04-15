import {createApp} from 'vue'
import {createRouter, createWebHistory} from "vue-router";

import App from './App.vue'
import RoomDetail from "@/components/RoomDetail.vue";
import ChatRoom from "@/components/RoomList.vue";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {name: 'room',
            path: '/rooms/:roomCode',
            component: RoomDetail,
        },
        {name: 'rooms', path: '/rooms', component: ChatRoom}
    ]
});


createApp(App).use(router)
    .mount('#app');
