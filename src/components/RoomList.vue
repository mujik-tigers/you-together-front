<template>
  <div class="container" id="app" v-cloak>
    <h3>채팅방 리스트</h3>

    <ul class="list-group">
      <li v-for="item in chatrooms" :key="item.code" @click="enterRoom(item.code)">
        {{ item.title }} - {{ item.currentParticipantsCount }} / {{ item.capacity }} - {{ item.passwordExist }}
      </li>
    </ul>
    <button @click="fetchAllRoom" v-if="!this.lastPage">더보기</button>
  </div>
</template>

<script>
import axios from 'axios';


export default {
  data() {
    return {
      room_name: '',
      chatrooms: [],
      lastPage: false,
      pageNumber: -1,
      serverURL: "http://localhost:8080",
    }
  },
  created() {
    this.fetchAllRoom();
  },
  methods: {
    fetchAllRoom() {
      if (this.lastPage) {
        return;
      }

      axios.get(this.serverURL + '/rooms', {params: {page: this.pageNumber + 1}}).then(response => {
        this.chatrooms = this.chatrooms.concat(response.data.data.rooms);
        this.lastPage = response.data.data.last;
        this.pageNumber = response.data.data.pageNumber;
      });
    },

    enterRoom(roomId) {
      window.location = "/rooms/" + roomId;
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

</style>
