<template>
  <div class="topLink">
    <router-link :to="'rooms/new'"> 새로운 방 만들기 </router-link>
  </div>

  <div class="roomList">
    <PasswordModal class="passwordModal" v-if="passwordModalState"></PasswordModal>
    <div v-if="passwordModalState == true" class="modalBackground" @click.self="closeModal"></div>
    <table class="rooms">
      <tr>
        <th>NO.</th>
        <th>TITLE</th>
        <th>CURRENT / CAPACITY</th>
        <th>TYPE</th>
      </tr>
      <tr v-for="(item, idx) in rooms" :key="item.roomCode">
        <td>{{ idx + 1 }}</td>
        <td style="width: 70%">
          <div v-if="!item.passwordExist">
            <router-link :to="'rooms/' + item.roomCode" class="roomTitle">
              {{ item.roomTitle }}
            </router-link>
          </div>
          <div v-else>
            <button class="seceretRoomTitle" @click="passwordModalState = true">
              {{ item.roomTitle }}
            </button>
          </div>
        </td>
        <td style="width: 20%">{{ item.currentParticipant }} / {{ item.capacity }}</td>
        <td style="width: 10%">
          <img style="width: 11px" v-if="item.passwordExist" :src="require('../assets/lock.svg')" alt="locked" />
          <img style="width: 12px" v-else :src="require('../assets/unlock.svg')" alt="unlocked" />
        </td>
      </tr>
    </table>
  </div>
  <button class="more" type="button" @click="fetchAllRoom" v-if="this.hasNext">MORE</button>
</template>

<script>
import axios from "axios";
import PasswordModal from "@/components/PasswordModal.vue"

export default {
  components: { PasswordModal },
  data() {
    return {
      rooms: [],
      hasNext: false,
      pageNumber: -1,
      roomListFetchUrl: "http://localhost:8080/rooms",
      // roomListFetchUrl: "https://you-together.site/rooms",
      passwordModalState: false,
    };
  },
  created() {
    this.fetchAllRoom();
  },
  methods: {
    fetchAllRoom() {
      axios.get(this.roomListFetchUrl, { params: { page: this.pageNumber + 1 } }).then((response) => {
        this.rooms = this.rooms.concat(response.data.data.rooms);
        this.hasNext = response.data.data.hasNext;
        this.pageNumber = response.data.data.pageNumber;
      });
    },
    enterRoom(roomCode) {
      this.$router.push("/rooms/" + roomCode);
    },
  },
};
</script>

<style scoped>
.passwordModal {
  position: absolute;
  top: 0px;
  left: 0px;
  z-index: 101;
}

.modalBackground {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #49dcb000;
  z-index: 100;
}

.roomList {
  position: relative;
  
  width: 800px;
  min-height: 300px;

  padding: 10px;
  margin: auto;
}

.rooms {
  width: inherit;
  margin: auto;

  font-family: Pretendard;
  font-size: 14px;
}

.rooms tr {
  line-height: 3;
}

.rooms th {
  position: sticky;

  font-size: 13px;
  font-weight: 700;
  color: #49dcb1;
}

.roomTitle {
  display: block;

  color: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;

  transition: all 0.2s ease-in-out;
}

.seceretRoomTitle {
  width: 100%;
  height: 42px;

  color: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;

  background: none;
  border: none;

  transition: all 0.2s ease-in-out;
}

.seceretRoomTitle:hover,
.roomTitle:hover,
.roomTitle > router-link-active {
  color: inherit;

  border-radius: 9px;
  background-color: #1d1d1f;

  cursor: pointer;
}

.roomTitle:visited,
.roomTitle > router-link-active {
  color: inherit;
}

.more {
  padding: 15px;

  margin-bottom: 10px;

  font-family: Pretendard;
  font-size: 12px;
  font-weight: 600;
  color: #49dcb1;

  background: none;

  border: none;
}

.more:hover {
  cursor: pointer;
}

.topLink {
  width: 800px;

  display: flex;
  justify-content: flex-end;

  margin: auto;
  padding-top: 20px;
  padding-bottom: 10px;
}

.topLink > a {
  font-family: Pretendard;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  color: inherit;

  padding: 12px;

  border-radius: 9px;
  background-color: #252527;

  transition: all 0.2s ease-in-out;
}

.topLink > a:hover {
  background-color: #303032;
}
</style>
