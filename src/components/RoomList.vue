<template>
  <button @click="createRoom">방 만들기</button>

  <div class="roomList">
    <table class="rooms">
      <tr>
        <th>no.</th>
        <th>방 제목</th>
        <th>참가자 / 정원</th>
        <th>비밀방</th>
      </tr>
      <tr v-for="(item, idx) in chatrooms" :key="item.roomCode">
        <td>{{ idx + 1 }}</td>
        <td style="width: 70%">
          <router-link :to="'rooms/' + item.roomCode" class="roomTitle">
            {{ item.roomTitle }}
          </router-link>
        </td>
        <td style="width: 15%">{{ item.currentParticipant }} / {{ item.capacity }}</td>
        <td style="width: 15%">
          <img style="width: 10px" v-if="item.passwordExist" :src="require('../assets/lock.svg')" alt="locked" />
          <img style="width: 13px" v-else :src="require('../assets/unlock.svg')" alt="unlocked" />
        </td>
      </tr>
    </table>
  </div>
  <button class="more" type="button" @click="fetchAllRoom" v-if="this.hasNext">더보기</button>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      room_name: "",
      chatrooms: [],
      hasNext: true,
      pageNumber: -1,
      serverURL: "http://localhost:8080",
      // serverURL: "https://you-together.site",
    };
  },
  created() {
    this.fetchAllRoom();
  },
  methods: {
    fetchAllRoom() {
      if (this.hasNext === false) {
        return;
      }

      axios.get(this.serverURL + "/rooms", { params: { page: this.pageNumber + 1 } }).then((response) => {
        this.chatrooms = this.chatrooms.concat(response.data.data.rooms);
        this.hasNext = response.data.data.hasNext;
        this.pageNumber = response.data.data.pageNumber;
      });
    },

    enterRoom(roomId) {
      this.$router.push("/rooms/" + roomId);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.roomList {
  width: 800px;
  min-height: 300px;

  padding: 10px;
  margin: auto;
}

.rooms {
  width: inherit;
  margin: auto;

  font-family: Pretendard;
  font-size: 13px;
  font-weight: 400;
}

.rooms tr {
  height: 35px;
}

.rooms th {
  position: sticky;

  font-size: 14px;
  font-weight: 500;
}

.roomTitle {
  color: #0f0f0f;

  text-decoration: none;
}

.roomTitle:hover,
.roomTitle > router-link-active {
  color: #0f0f0f;

  font-weight: 500;
}

.roomTitle:visited,
.roomTitle > router-link-active {
  color: inherit;
}

.more {
  padding: 15px;

  font-family: Pretendard;
  font-size: 11px;
  font-weight: 500;

  background: none;

  border: none;
}

.more:hover {
  cursor: pointer;
}
</style>
