<template>
  <div class="titleMiniModal">
    <input type="text" placeholder="제목은 1자 이상 30자 이하로 입력해주세요" v-model="newTitleInput" />
    <button @click="changeTitle">✓</button>
  </div>
</template>

<script>
import axios from "axios";

axios.defaults.withCredentials = true;

export default {
  props: {
    roomCode: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      serverBaseUrl: "http://localhost:8080",
      // serverBaseUrl: "https://you-together.site",

      newTitleInput: "",
    };
  },
  methods: {
    changeTitle() {
      axios
        .patch(this.serverBaseUrl + "/rooms/title", {
          roomCode: this.roomCode,
          newTitle: this.newTitleInput,
        })
        .then((response) => {
          this.$emit("success", response.data.data.changedRoomTitle);
        });

      this.newTitleInput = "";
    },
  },
};
</script>

<style scoped>
.titleMiniModal {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 310px;
  height: 55px;

  border-radius: 10px;
  background-color: #303032;
}

.titleMiniModal > input {
  width: 220px;
  height: 20px;

  padding: 8px 14px 8px 14px;

  border: none;
  border-radius: 10px;
  background-color: #303032;

  font-family: Pretendard;
  font-size: 13px;
  font-weight: 400;
  color: #f4f3ee;

  transition: 0.4s all ease-in-out;
}

.titleMiniModal > input:focus {
  outline: none;
  background-color: #272729;
}

.titleMiniModal > button {
  width: 35px;
  height: 35px;

  border: none;
  border-radius: 18px;

  padding: 6px;
  margin-left: 5px;

  font-size: 16px;
  font-weight: 800;
  color: #49dcb1;
  background-color: #252527;
}

.titleMiniModal > button:hover,
.titleMiniModal > button:focus {
  cursor: pointer;
  outline: none;

  background-color: #303032;
}
</style>
