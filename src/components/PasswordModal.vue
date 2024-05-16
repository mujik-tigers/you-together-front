<template>
  <div class="passwordMiniModal">
    <span style="font-size: 13px; font-weight: 600;">해당 방은 비밀방입니다.</span>
    <div class="miniInput">
      <input type="text" placeholder="비밀번호를 입력해주세요" v-model="passwordInput" />
      <button @click="routeToRoom">✓</button>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    roomCode: {
      type: String,
      required: true,
    }
  },
  data() {
    return {
      passwordInput: "",
    };
  },
  methods: {
    routeToRoom() {
      localStorage.setItem('roomPassword_' + this.roomCode, this.passwordInput);
      this.$router.push("/rooms/" + this.roomCode);
      this.passwordInput = "";
    },
  },
};
</script>

<style scoped>
.passwordMiniModal,
.miniInput {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 310px;

  border-radius: 10px;
  background-color: #303032;
}

.passwordMiniModal {
  flex-direction: column;
  justify-content: space-evenly;

  height: 110px;
}

.miniInput > input {
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

.miniInput > input:focus {
  outline: none;
  background-color: #272729;
}

.miniInput > button {
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

.miniInput > button:hover,
.miniInput > button:focus {
  cursor: pointer;
  outline: none;

  background-color: #303032;
}
</style>
