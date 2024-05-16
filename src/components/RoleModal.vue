<template>
  <div class="roleMiniModal">
    <div v-for="(item, idx) in roles" :key="idx">
      <button v-if="isUnderRole(item)" @click="changeUserRole(item)">{{ item }}</button>
    </div>
  </div>
</template>

<script>
import axios from "axios";

axios.defaults.withCredentials = true;

export default {
  props: {
    userRole: {
      type: String,
      required: true,
    },
    targetUserId: {
      type: Number,
      required: true,
    },
    originTargetUserRole: {
      type: String,
      required: true,
    }
  },
  created() {
    const priorities = {
        HOST: 5,
        MANAGER: 4,
        EDITOR: 3,
        GUEST: 2,
        VIEWER: 1,
      };

    for (const key in priorities) {
      this.priorityMap.set(key, priorities[key]);
    }
  },
  data() {
    return {
      serverBaseUrl: "http://localhost:8080",
      // serverBaseUrl: "https://you-together.site",

      roles: ["HOST", "MANAGER", "EDITOR", "GUEST", "VIEWER"],
      priorityMap: new Map(),
    };
  },
  methods: {
    changeUserRole(newUserRole) {
      axios
        .patch(this.serverBaseUrl + "/users/role", {
          targetUserId: this.targetUserId,
          newUserRole: newUserRole,
        })
        .then(() => {
          this.$emit("success");
        });
    },
    isUnderRole(targetUserRole) {
      return this.originTargetUserRole != targetUserRole && this.priorityMap.get(targetUserRole) <= this.priorityMap.get(this.userRole);
    },
  },
};
</script>

<style scoped>
.roleMiniModal {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;

  width: 80px;
  min-height: 80px;

  border-radius: 10px;
  background-color: #303032;
}

button {
  width: 70px;
  height: 30px;

  border: none;
  border-radius: 10px;

  padding: 6px;
  margin: 4px 4px;

  font-size: 10px;
  font-weight: 700;
  color: #49dcb1;
  background-color: #303032;

}

button:hover,
button:focus {
  cursor: pointer;
  outline: none;

  background-color: #252527;
}
</style>
