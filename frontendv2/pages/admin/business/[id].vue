<template>
  <div class="main-content max-w-4xl" v-if="item">
    <h1 class="section-title mb-4">Éditer la fiche #{{ item.idBusiness }}</h1>

    <form class="card p-5 space-y-4" @submit.prevent="save">
      <div>
        <label class="block text-sm mb-1">Dénomination</label>
        <input v-model="item.denomination" class="form-input w-full" required />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Type</label>
          <input v-model="item.type" class="form-input w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Origine</label>
          <input v-model="item.origine" class="form-input w-full" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Site officiel</label>
          <input v-model="item.siteOfficiel" class="form-input w-full" placeholder="https://..." />
        </div>
        <div>
          <label class="block text-sm mb-1">Date</label>
          <input v-model="item.date" class="form-input w-full" />
        </div>
      </div>
      <div>
        <label class="block text-sm mb-1">Notes</label>
        <textarea v-model="item.notes" rows="4" class="form-input w-full" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label class="block text-sm mb-1">Statut</label>
          <select v-model.number="item.statut" class="form-input w-full">
            <option :value="1">Actif</option>
            <option :value="0">Inactif</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Image (upload)</label>
          <input type="file" accept="image/*" @change="onFile" />
          <div v-if="item.image" class="text-xs text-gray-500 mt-1">Fichier: {{ item.image }}</div>
        </div>
      </div>
      <div class="flex gap-3">
        <button type="submit" class="btn-primary">Enregistrer</button>
        <NuxtLink to="/admin/business" class="btn-secondary">Retour</NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuthStore()

const item = ref<any>(null)

const load = async () => {
  const res = await $fetch(`${config.public.apiBase}/api/admin/business/${route.params.id}`, {
    headers: auth.getAuthHeaders() as any
  })
  item.value = res
}

const onFile = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  const fd = new FormData()
  fd.append('file', files[0])
  fd.append('type', 'cover')
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/media/upload`, {
      method: 'POST', body: fd, headers: auth.getAuthHeaders() as any
    })
    item.value.image = res.filename
  } catch (err) {
    console.error('Upload error', err)
    alert('Échec de l\'upload')
  }
}

const save = async () => {
  try {
    const body: any = {
      denomination: item.value.denomination,
      type: item.value.type,
      origine: item.value.origine,
      siteOfficiel: item.value.siteOfficiel,
      date: item.value.date,
      notes: item.value.notes,
      statut: item.value.statut,
      image: item.value.image,
    }
    await $fetch(`${config.public.apiBase}/api/admin/business/${item.value.idBusiness}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) },
      body
    })
    alert('Enregistré')
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || 'Erreur lors de l\'enregistrement')
  }
}

onMounted(load)
</script>

<style scoped>
.btn-primary { background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; }
.btn-secondary { background: #f3f4f6; color: #111827; padding: 8px 12px; border-radius: 6px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
.form-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
</style>

