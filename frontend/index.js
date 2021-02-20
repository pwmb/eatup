var app = new Vue({
    el: '#app',
    data: {
        keyword: "",
        searchResults: [],
        searching: false,
        todayList: [],
        currentFood: null
    },
    mounted: function () {
        const cache = getFromCache("today");
        if (cache && cache.length) {
            this.todayList = cache;
        }
    },
    methods: {
        search() {
            if (this.keyword === "") {
                this.searchResults = []
                return
            }
            if (this.keyword.length > 3) {
                const cache = getFromCache(this.keyword)
                if (cache) {
                    this.searchResults = cache;
                    return;
                }

                this.searching = true;
                fetch(`/search/${this.keyword}`).then((resp) => resp.json())
                    .then((resp) => {
                        if (resp.error) {
                            alert("failed to fetch");
                            throw resp.err;
                        }
                        this.searching = false;
                        this.searchResults = resp.foods.food
                        saveToCache(this.keyword, resp.foods.food)
                    })
                    .catch((err) => {
                        this.searching = false;
                        console.error(err)
                    })
            }
        },
        fetchFoodDetails(data) {
            const cache = getFromCache(data.food_id)
            if (cache) {
                this.currentFood = cache
                return;
            }
            this.searching = true;
            fetch(`/food/${data.food_id}`)
                .then((resp) => resp.json())
                .then((resp) => {
                    if (resp.error) {
                        alert("failed to fetch");
                        throw resp.err;
                    }
                    Object.assign(resp, data)
                    saveToCache(data.food_id, resp)
                    this.currentFood = resp
                    this.searching = false;
                })
                .catch((err) => {
                    this.searching = false;
                    console.error(err)
                })
        },
        addToMyDailyList(qty) {
            const isExist = this.todayList.filter((v) => v.food_id === this.currentFood.food_id)
            if (!isExist || isExist.length === 0) {
                this.currentFood["qty"] = qty;
                this.todayList.push(this.currentFood);
                saveToCache("today", this.todayList);
            }
            this.currentFood = null;
            this.searchResults = [];
        },
        updateQtyFor() {
            saveToCache("today", this.todayList)
        },
        deleteFoodItemFromTodayList(index) {
            this.todayList.splice(index, 1);
            saveToCache("today", this.todayList)
        }
    },
    computed: {
        results: function () {
            return this.searchResults.splice(0, 30)
        },
        totalFat: function () {
            let fat = 0
            this.todayList.forEach((v) => {
                fat += amount(v, "fat")
            })
            return Math.ceil(fat)
        },
        totalProtein: function () {
            let protein = 0
            this.todayList.forEach((v) => {
                protein += amount(v, "protein")
            })
            return Math.ceil(protein)
        },
        totalCalories: function () {
            let calories = 0
            this.todayList.forEach((v) => {
                calories += amount(v, "calories")
            })
            return Math.ceil(calories)
        },
        totalNetCarbs: function () {
            let carbohydrate = 0
            this.todayList.forEach((v) => {
                carbohydrate += amount(v, "carbohydrate") - amount(v, "fiber")
            })
            return Math.ceil(carbohydrate)
        }
    }
})

function amount(a, key) {
    return (parseFloat(a[key]) * parseFloat(a.qty) || 0) / parseFloat(a.number_of_units)
}

function saveToCache(key, value) {
    if (window.localStorage) {
        window.localStorage.setItem(key, JSON.stringify(value))
    }
}

function getFromCache(key) {
    if (window.localStorage) {
        const has = window.localStorage.getItem(key);
        if (has) {
            return JSON.parse(has)
        }
    }
}


