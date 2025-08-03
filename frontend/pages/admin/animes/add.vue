<template>
  <div>
    <h1>Test - Add New Anime</h1>
    <p>This is a test page to verify routing works</p>
    
    <form class="simple-form">
      <div>
        <label>Titre:</label>
        <input type="text" v-model="titre" />
      </div>
      
      <div>
        <label>Année:</label>
        <input type="text" v-model="annee" />
      </div>
      
      <button type="submit">Test Submit</button>
    </form>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const titre = ref('')
const annee = ref('')
</script>

<style scoped>
.simple-form {
  max-width: 500px;
  margin: 20px;
}

.simple-form div {
  margin-bottom: 15px;
}

.simple-form label {
  display: block;
  margin-bottom: 5px;
}

.simple-form input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
}
</style>