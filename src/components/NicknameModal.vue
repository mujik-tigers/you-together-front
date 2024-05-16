<template>
  <div class="nicknameMiniModal">
    <div>
      <input type="text" placeholder="닉네임은 20자 이내로 입력해주세요" v-model="newNicknameInput" />
      <button @click="changeNickname">✓</button>
    </div>
    <span v-if="errorMessage != ''">{{ errorMessage }}</span>
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
      errorMessage: "",
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
        })
        .catch((error) => {
          this.errorMessage = "";

          if (error.response.data.code == 400 && Array.isArray(error.response.data.data)) {
            const splitMessages = error.response.data.data[0].message.split(", ");

            if (splitMessages.length == 1) {
              this.errorMessage = splitMessages[0];
            } else {
              for (let i = 0; i < splitMessages.length; i++) {
                this.errorMessage += splitMessages[i];
                if (i < splitMessages.length - 1) {
                  this.errorMessage += "\n";
                }
              }
            }
          }
        });
    },
  },
};
</script>

<style scoped>
.nicknameMiniModal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 310px;
  min-height: 60px;

  border-radius: 10px;
  background-color: #303032;
}

input {
  width: 220px;
  height: 20px;

  padding: 8px 14px 8px 14px;
  margin: 8px 0px;
  
  border: none;
  border-radius: 10px;
  background-color: #303032;

  font-family: Pretendard;
  font-size: 13px;
  font-weight: 400;
  color: #f4f3ee;

  transition: 0.4s all ease-in-out;
}

input:focus {
  outline: none;
  background-color: #272729;
}

button {
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

button:hover,
button:focus {
  cursor: pointer;
  outline: none;

  background-color: #303032;
}

span {
  width: 85%;
  color: #49dcb1;

  font-family: Pretendard;
  font-size: 11px;
  font-weight: 500;

  white-space: pre;
  text-align: left;

  margin-bottom: 8px;
}
</style>
