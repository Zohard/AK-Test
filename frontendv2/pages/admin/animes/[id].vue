<template>
  <div class="main-content max-w-4xl" v-if="anime">
    <h1 class="section-title mb-4">Éditer l'anime #{{ anime.idAnime }}</h1>

    <form class="card p-5 space-y-4" @submit.prevent="save">
      <div>
        <label class="block text-sm mb-1">Titre</label>
        <input v-model="anime.titre" class="form-input w-full" required />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Année</label>
          <input v-model.number="anime.annee" type="number" min="1900" class="form-input w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Nombre d'épisodes</label>
          <input v-model.number="anime.nbEp" type="number" min="0" class="form-input w-full" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm mb-1">Studio</label>
          <input v-model="anime.studio" class="form-input w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Réalisateur</label>
          <input v-model="anime.realisateur" class="form-input w-full" />
        </div>
      </div>
      <div>
        <label class="block text-sm mb-1">Synopsis</label>
        <textarea v-model="anime.synopsis" rows="4" class="form-input w-full" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div>
          <label class="block text-sm mb-1">Statut</label>
          <select v-model.number="anime.statut" class="form-input w-full">
            <option :value="0">Brouillon</option>
            <option :value="1">Publié</option>
            <option :value="2">Refusé</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Image (upload)</label>
          <input type="file" accept="image/*" @change="onFile" />
          <div v-if="anime.image" class="text-xs text-gray-500 mt-1">Fichier: {{ anime.image }}</div>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="submit" class="btn-primary">Enregistrer</button>
        <NuxtLink to="/admin/animes" class="btn-secondary">Retour</NuxtLink>
      </div>
    </form>

    <!-- Relations -->
    <div class="card p-5 mt-6">
      <h2 class="text-lg font-semibold mb-3">Relations</h2>
      <div v-if="relations.length === 0" class="text-sm text-gray-500">Aucune relation</div>
      <ul v-else class="space-y-2 mb-3">
        <li v-for="rel in relations" :key="rel.id_relation" class="flex items-center justify-between">
          <div>
            <span class="font-medium">{{ rel.related_title || '—' }}</span>
            <span class="text-xs text-gray-500"> ({{ rel.typeRelation || 'related' }})</span>
          </div>
          <button class="btn-small danger" @click="deleteRelation(rel)">Supprimer</button>
        </li>
      </ul>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label class="block text-sm mb-1">Type lié</label>
          <select v-model="relForm.related_type" class="form-input w-full">
            <option value="anime">Anime</option>
            <option value="manga">Manga</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">ID lié</label>
          <input v-model.number="relForm.related_id" type="number" class="form-input w-full" />
        </div>
        <div>
          <label class="block text-sm mb-1">Type relation</label>
          <input v-model="relForm.relation_type" class="form-input w-full" placeholder="related, sequel, ..." />
        </div>
        <div>
          <button class="btn-primary w-full" @click="addRelation">Ajouter</button>
        </div>
      </div>
    </div>

    <!-- Staff -->
    <div class="card p-5 mt-6">
      <h2 class="text-lg font-semibold mb-3">Staff (Business)</h2>
      <div v-if="staff.length === 0" class="text-sm text-gray-500">Aucun staff</div>
      <ul v-else class="space-y-2 mb-3">
        <li v-for="s in staff" :key="s.id_relation || s.id_business" class="flex items-center justify-between">
          <div>
            <span class="font-medium">{{ s.nom }}</span>
            <span class="text-xs text-gray-500"> ({{ s.type || '—' }})</span>
          </div>
          <button class="btn-small danger" @click="removeStaff(s)">Retirer</button>
        </li>
      </ul>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div class="md:col-span-2">
          <label class="block text-sm mb-1">Recherche business</label>
          <input v-model="businessQuery" class="form-input w-full" placeholder="Nom du studio/éditeur..." @input="debouncedSearchBusiness" />
          <div v-if="businessOptions.length" class="mt-2 text-sm">
            <button v-for="b in businessOptions" :key="b.idBusiness" class="btn-small mr-2 mb-2" @click="selectBusiness(b)">{{ b.denomination }}</button>
          </div>
        </div>
        <div>
          <label class="block text-sm mb-1">Business ID</label>
          <input v-model.number="staffForm.businessId" type="number" class="form-input w-full" />
        </div>
        <div>
          <button class="btn-primary w-full" @click="addStaff">Ajouter</button>
        </div>
      </div>
    </div>

    <!-- Tags -->
    <div class="card p-5 mt-6">
      <h2 class="text-lg font-semibold mb-3">Tags</h2>
      <div v-if="tags.length === 0" class="text-sm text-gray-500">Aucun tag</div>
      <ul v-else class="flex flex-wrap gap-2 mb-3">
        <li v-for="t in tags" :key="t.id" class="chip">
          {{ t.nom }}
          <button class="btn-x" @click="removeTag(t)">×</button>
        </li>
      </ul>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div class="md:col-span-2">
          <label class="block text-sm mb-1">Rechercher un tag</label>
          <input v-model="tagSearch" class="form-input w-full" placeholder="Nom du tag..." @input="debouncedSearchTags" />
          <div v-if="tagOptions.length" class="mt-2 text-sm">
            <button v-for="opt in tagOptions" :key="opt.id" class="btn-small mr-2 mb-2" @click="selectTag(opt)">{{ opt.name }} <span class="text-xs text-gray-500">({{ opt.categorie }})</span></button>
          </div>
        </div>
        <div>
          <label class="block text-sm mb-1">Catégorie</label>
          <select v-model="tagCategory" class="form-input w-full" @change="debouncedSearchTags">
            <option value="">Toutes</option>
            <option value="Genre">Genre</option>
            <option value="Thème">Thème</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">Tag ID</label>
          <input v-model.number="tagForm.tagId" type="number" class="form-input w-full" />
        </div>
        <div>
          <button class="btn-primary w-full" @click="addTag">Ajouter</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuthStore()

const anime = ref<any>(null)

const load = async () => {
  const res = await $fetch(`${config.public.apiBase}/api/admin/animes/${route.params.id}`, {
    headers: auth.getAuthHeaders() as any
  })
  anime.value = res
}

const onFile = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || !files[0]) return
  const fd = new FormData()
  fd.append('file', files[0])
  fd.append('type', 'anime')
  fd.append('relatedId', String(anime.value.idAnime))
  try {
    const res: any = await $fetch(`${config.public.apiBase}/api/media/upload`, {
      method: 'POST', body: fd, headers: auth.getAuthHeaders() as any
    })
    anime.value.image = res.filename
  } catch (err) {
    console.error('Upload error', err)
    alert('Échec de l\'upload')
  }
}

const save = async () => {
  try {
    const body: any = {
      titre: anime.value.titre,
      annee: anime.value.annee,
      nbEp: anime.value.nbEp,
      studio: anime.value.studio,
      realisateur: anime.value.realisateur,
      synopsis: anime.value.synopsis,
      image: anime.value.image,
      statut: anime.value.statut,
    }
    await $fetch(`${config.public.apiBase}/api/admin/animes/${anime.value.idAnime}`, {
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

// Admin content helpers
const type = 'anime'
const relations = ref<any[]>([])
const staff = ref<any[]>([])
const tags = ref<any[]>([])

const loadAdminExtras = async () => {
  const [rels, stf, tgs] = await Promise.all([
    $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/relationships`, { headers: auth.getAuthHeaders() as any }),
    $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/staff`, { headers: auth.getAuthHeaders() as any }),
    $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/tags`, { headers: auth.getAuthHeaders() as any }),
  ])
  relations.value = rels as any[]
  staff.value = stf as any[]
  tags.value = tgs as any[]
}

watch(anime, (v) => { if (v) loadAdminExtras() })

// Relations
const relForm = reactive<any>({ related_type: 'anime', related_id: undefined, relation_type: 'related' })
const addRelation = async () => {
  if (!relForm.related_id) return
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/relationships`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, body: relForm
  })
  relForm.related_id = undefined
  await loadAdminExtras()
}
const deleteRelation = async (rel: any) => {
  await $fetch(`${config.public.apiBase}/api/admin/content/relationships/${rel.id_relation}`, {
    method: 'DELETE', headers: auth.getAuthHeaders() as any
  })
  await loadAdminExtras()
}

// Staff
const businessQuery = ref('')
const businessOptions = ref<any[]>([])
const staffForm = reactive<any>({ businessId: undefined, role: '' })
const debouncedSearchBusiness = useDebounceFn(async () => {
  if (!businessQuery.value) { businessOptions.value = []; return }
  const res: any = await $fetch(`${config.public.apiBase}/api/admin/business`, {
    params: { search: businessQuery.value, page: 1, limit: 10 }, headers: auth.getAuthHeaders() as any
  })
  businessOptions.value = res.items || []
}, 400)
const selectBusiness = (b: any) => { staffForm.businessId = b.idBusiness }
const addStaff = async () => {
  if (!staffForm.businessId) return
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/staff`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, body: staffForm
  })
  staffForm.businessId = undefined
  await loadAdminExtras()
}
const removeStaff = async (s: any) => {
  const id = s.id_business || s.idBusiness
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/staff/${id}`, {
    method: 'DELETE', headers: auth.getAuthHeaders() as any
  })
  await loadAdminExtras()
}

// Tags
const tagForm = reactive<any>({ tagId: undefined })
const tagSearch = ref('')
const tagOptions = ref<any[]>([])
const tagCategory = ref('')
const debouncedSearchTags = useDebounceFn(async () => {
  if (!tagSearch.value) { tagOptions.value = []; return }
  const res: any = await $fetch(`${config.public.apiBase}/api/admin/content/tags/search`, {
    params: { q: tagSearch.value, limit: 10, categorie: tagCategory.value || undefined }, headers: auth.getAuthHeaders() as any
  })
  const attachedIds = new Set(tags.value.map((t: any) => t.id))
  tagOptions.value = (res.items || []).filter((opt: any) => !attachedIds.has(opt.id))
}, 300)
const selectTag = (opt: any) => { tagForm.tagId = opt.id }
const addTag = async () => {
  if (!tagForm.tagId) return
  // Prevent adding duplicate
  if (tags.value.some((t: any) => t.id === tagForm.tagId)) {
    alert('Ce tag est déjà associé')
    return
  }
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/tags`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth.getAuthHeaders() as any) }, body: tagForm
  })
  tagForm.tagId = undefined
  await loadAdminExtras()
}
const removeTag = async (t: any) => {
  await $fetch(`${config.public.apiBase}/api/admin/content/${type}/${anime.value.idAnime}/tags/${t.id}`, {
    method: 'DELETE', headers: auth.getAuthHeaders() as any
  })
  await loadAdminExtras()
}
</script>

<style scoped>
.btn-primary { background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; }
.btn-secondary { background: #f3f4f6; color: #111827; padding: 8px 12px; border-radius: 6px; }
.card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; }
.form-input { border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; }
.btn-small { background: #e5e7eb; color: #111827; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
.btn-small.danger { background: #fee2e2; color: #991b1b; }
.btn-x { margin-left: 8px; background: transparent; color: #6b7280; }
.chip { padding: 2px 8px; border-radius: 9999px; background: #f3f4f6; font-size: 12px; }
</style>
