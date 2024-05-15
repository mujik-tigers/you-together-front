<template>
  <div class="nicknameMiniModal">
    <input type="text" placeholder="닉네임은 20자 이내로 입력해주세요" v-model="newNicknameInput" />
    <button @click="changeNickname">✓</button>
  </div>
</template>

<script>
import axios from "axios";

axios.defaults.withCredentials = true;

export default {
  data() {
    return {
      serverBaseUrl: "http://localhost:8080",
      // serverBaseUrl: "https://you-together.site",

      newNicknameInput: "",
    };
  },
  methods: {
    changeNickname() {
      axios
        .patch(this.serverBaseUrl + "/users", {
          newNickname: this.newNicknameInput,
        })
        .then(() => {
          this.$emit('success');
        });

      this.newNicknameInput = "";
    },
  },
};
</script>

<style scoped>
.nicknameMiniModal {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 310px;
  height: 55px;

  border-radius: 10px;
  background-color: #303032;
}

.nicknameMiniModal > input {
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

.nicknameMiniModal > input:focus {
  outline: none;
  background-color: #272729;
}

.nicknameMiniModal > button {
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

.nicknameMiniModal > button:hover,
.nicknameMiniModal > button:focus {
  cursor: pointer;
  outline: none;

  background-color: #303032;
}
</style>
