<template>
  <div class="main-content max-w-3xl">
    <h1 class="section-title mb-4">Créer un manga</h1>

    <form class="card p-5 space-y-4" @submit.prevent="submit">
      <div>
        <label class="block text-sm mb-1">Titre *</label>
        <input v-model="form.titre" class="form-input w-full" required />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Auteur</label>
          <input v-model="form.auteur" class="form-input w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Année (AAAA)</label>
          <input v-model="form.annee" maxlength="4" class="form-input w-full" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Éditeur</label>
          <input v-model="form.editeur" class="form-input w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Nb Volumes (numérique)</label>
          <input v-model.number="form.nbVol" type="number" min="0" class="form-input w-full" />
        </div>
      </div>
      <div>
        <label class="block text-sm mb-1">Synopsis</label>
        <textarea v-model="form.synopsis" rows="4" class="form-input w-full" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label class="block text-sm mb-1">Statut</label>
          <select v-model.number="form.statut" class="form-input w-full">
            <option :value="1">Affichée</option>
            <option :value="2">En attente</option>
            <option :value="0">Bloquée</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Image (upload)</label>
          <input type="file" accept="image/*" @change="onFile" />
          <div v-if="form.image" class="text-xs text-gray-500 mt-1">Fichier: {{ form.image }}</div>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" class="btn-primary">Créer</button>
        <NuxtLink to="/admin/mangas" class="btn-secondary">Annuler</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const router = useRouter()
const auth = useAuthStore()

const form = reactive<any>({ titre: '', statut: 0 })

const onFile = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  const fd = new FormData()
  fd.append('file', files[0])
  fd.append('type', 'manga')
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/media/upload`, {
      method: 'POST', body: fd, headers: auth.getAuthHeaders() as any
    })
    form.image = res.filename
  } catch (err) {
    console.error('Upload error', err)
    alert('Échec de l\'upload')
  }
}

const submit = async () => {
  try {
    await $fetch(`${config.public.apiBase}/api/admin/mangas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) },
      body: form
    })
    router.push('/admin/mangas')
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || 'Erreur lors de la création')
  }
}
</script>

<style scoped>
.btn-primary { background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; }
.btn-secondary { background: #f3f4f6; color: #111827; padding: 8px 12px; border-radius: 6px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
.form-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
</style>

