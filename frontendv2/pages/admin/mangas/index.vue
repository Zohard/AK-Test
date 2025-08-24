<template>
  <div class="main-content">
    <div class="section-header">
      <h1 class="section-title">Admin · Mangas</h1>
    </div>

    <div class="card p-4 mb-4 flex gap-3 items-end">
      <div>
        <label class="block text-sm mb-1">Recherche</label>
        <input v-model="filters.search" class="form-input" placeholder="Titre..." @keyup.enter="load" />
      </div>
      <div>
        <label class="block text-sm mb-1">Année</label>
        <input v-model="filters.annee" class="form-input w-32" />
      </div>
      <div>
        <label class="block text-sm mb-1">Éditeur</label>
        <input v-model="filters.editeur" class="form-input" />
      </div>
      <div>
        <label class="block text-sm mb-1">Statut</label>
        <select v-model.number="filters.statut" class="form-input w-40">
          <option :value="undefined">Tous</option>
          <option :value="0">Brouillon</option>
          <option :value="1">Publié</option>
          <option :value="2">Refusé</option>
        </select>
      </div>
      <button class="btn-secondary" @click="load">Appliquer</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Année</th>
            <th>Éditeur</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in items" :key="m.idManga">
            <td>{{ m.idManga }}</td>
            <td>{{ m.titre }}</td>
            <td>{{ m.auteur || '—' }}</td>
            <td>{{ m.annee || '—' }}</td>
            <td>{{ m.editeur || '—' }}</td>
            <td>
              <span :class="['chip', m.statut === 1 ? 'chip-green' : m.statut === 2 ? 'chip-red' : 'chip-gray']">
                {{ m.statut === 1 ? 'Publié' : m.statut === 2 ? 'Refusé' : 'Brouillon' }}
              </span>
            </td>
            <td class="flex gap-2">
              <button class="btn-small" @click="toggleStatus(m)">
                {{ m.statut === 1 ? 'Dépublier' : 'Publier' }}
              </button>
              <button class="btn-small danger" @click="remove(m)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex items-center gap-3">
      <button class="btn-secondary" :disabled="page<=1" @click="page--; load()">Précédent</button>
      <span>Page {{ page }} / {{ totalPages }}</span>
      <button class="btn-secondary" :disabled="page>=totalPages" @click="page++; load()">Suivant</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const auth = useAuthStore()

const items = ref<any[]>([])
const page = ref(1)
const limit = ref(20)
const totalPages = ref(1)

const filters = reactive<{ search?: string; annee?: string; editeur?: string; statut?: number | undefined }>({})

const load = async () => {
  const params: any = { page: page.value, limit: limit.value, ...filters }
  const res = await $fetch(`${config.public.apiBase}/api/admin/mangas`, {
    params,
    headers: auth.getAuthHeaders() as any
  })
  items.value = (res as any).items || []
  const p = (res as any).pagination || {}
  totalPages.value = p.totalPages || 1
}

onMounted(load)

const toggleStatus = async (m: any) => {
  const newStatus = m.statut === 1 ? 0 : 1
  await $fetch(`${config.public.apiBase}/api/admin/mangas/${m.idManga}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) },
    body: { statut: newStatus }
  })
  await load()
}

const remove = async (m: any) => {
  if (!confirm(`Supprimer "${m.titre}" ?`)) return
  await $fetch(`${config.public.apiBase}/api/admin/mangas/${m.idManga}`, {
    method: 'DELETE',
    headers: auth.getAuthHeaders() as any
  })
  await load()
}
</script>

<style scoped>
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
.chip { padding: 2px 8px; border-radius: 9999px; font-size: 12px; }
.chip-green { background: #dcfce7; color: #166534; }
.chip-red { background: #fee2e2; color: #991b1b; }
.chip-gray { background: #f3f4f6; color: #374151; }
.btn-secondary { background: #f3f4f6; color: #111827; padding: 8px 12px; border-radius: 6px; }
.btn-small { background: #e5e7eb; color: #111827; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
.btn-small.danger { background: #fee2e2; color: #991b1b; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
.form-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
</style>
