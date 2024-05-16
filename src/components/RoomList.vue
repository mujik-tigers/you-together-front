<template>
  <div class="topLink">
    <span id="mainLogo">youtogether</span>
    <router-link :to="'rooms/new'"> 새로운 방 만들기 </router-link>
  </div>

  <div v-if="passwordModalState == true" class="modalBackground" @click.self="closeModal"></div>
  <div class="roomList">
    <PasswordModal :roomCode="this.selectedRoomCode" class="passwordModal" v-if="passwordModalState"></PasswordModal>
    <table class="rooms">
      <tr>
        <th style="width: 10%">TYPE</th>
        <th style="width: 50%;"><span style="padding-right: 50px;">TITLE</span></th>
        <th style="width: 20%">VIDEO</th>
        <th style="width: 20%">CURRENT / CAPACITY</th>
      </tr>
      <tr v-for="(item) in rooms" :key="item.roomCode">
        <td>
          <img style="width: 11px" v-if="item.passwordExist" :src="require('../assets/lock.svg')" alt="locked" />
          <img style="width: 13px" v-else :src="require('../assets/unlock.svg')" alt="unlocked" />
        </td>
        <td class="titleHover">
          <div style="display: flex; flex-direction: column; align-items: flex-start; width: 300px; margin: auto;">
            <div v-if="!item.passwordExist">
              <router-link :to="'rooms/' + item.roomCode" class="roomTitle">
                {{ item.roomTitle }}
              </router-link>
            </div>
            <div v-else>
              <button class="seceretRoomTitle" @click="select(item.roomCode)">
                {{ item.roomTitle }}
              </button>
            </div>
            <span class="subTitle">지금은 <span style="color: #49dcb1"> {{ item.videoTitle }} </span> <span> 보는 중</span></span>
          </div>
        </td>
        <td class="videoInformation"><img :src="item.videoThumbnail" width="100px" /></td>
        <td><span style="color: #49dcb1;">{{ item.currentParticipant }}</span> / {{ item.capacity }}</td>
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
      selectedRoomCode: null,
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
    select(roomCode) {
      this.selectedRoomCode = roomCode;
      this.passwordModalState = true;
    },
    closeModal() {
      this.selectedRoomCode = null;
      this.passwordModalState = false;
    },
  },
};
</script>

<style scoped>
#mainLogo {
  font-size: 16px;
  font-weight: 700;
  color: #49dcb1;
}

.subTitle {
  font-size: 12px;
  font-weight: 600;
  color: #888888;

  padding-top: 5px;
}

.passwordModal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 101;
}

.modalBackground {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #161616bd;
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
  height: 80px;
}

.rooms td > img {
  vertical-align: middle;
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
}

.seceretRoomTitle {
  padding: 0;

  color: inherit;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;

  background: none;
  border: none;
}

.titleHover{
  transition: all 0.2s ease-in-out;
}

.titleHover:hover,
.titleHover:hover,
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
  justify-content: space-between;
  align-items: center;

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
