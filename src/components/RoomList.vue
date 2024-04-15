<template>
  <div class="container" id="app" v-cloak>
    <h3>채팅방 리스트</h3>

    <ul class="list-group">
      <li v-for="item in chatrooms" :key="item.roomCode" @click="enterRoom(item.roomCode)">
        {{ item.roomTitle }} - {{ item.currentParticipant }} / {{ item.capacity }} - {{ item.passwordExist }}
      </li>
    </ul>
    <button @click="fetchAllRoom" v-if="this.hasNext">더보기</button>
  </div>

  <button @click="createRoom">
    방 만들기
  </button>

</template>

<script>
import axios from 'axios';


export default {
  data() {
    return {
      room_name: '',
      chatrooms: [],
      hasNext: true,
      pageNumber: -1,
      serverURL: "http://localhost:8080",
      // serverURL: "https://you-together.site",
    }
  },
  created() {
    this.fetchAllRoom();
  },
  methods: {
    fetchAllRoom() {
      if (this.hasNext === false) {
        return;
      }

      axios.get(this.serverURL + '/rooms', {params: {page: this.pageNumber + 1}}).then(response => {
        this.chatrooms = this.chatrooms.concat(response.data.data.rooms);
        this.hasNext = response.data.data.hasNext;
        this.pageNumber = response.data.data.pageNumber;
      });
    },

    enterRoom(roomId) {
      this.$router.push('/rooms/' + roomId);
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
