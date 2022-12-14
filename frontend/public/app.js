/* global Vue, Vuex, axios, track */
/* eslint-disable no-console */
/* eslint-disable-next-line */
;(function () {
  Vue.use(Vuex)

  function randomId() {
    return Math.random().toString().substr(2, 10)
  }

  // make requests to our API running locally
  const instance = axios.create({
    baseURL: 'http://localhost:3000',
    timeout: 1000
  })

  /**
   * When adding new todo items, we can force the delay by using
   * the URL query parameter `addTodoDelay=<ms>`.
   */
  let addTodoDelay = 0

  const store = new Vuex.Store({
    state: {
      loading: false,
      todos: [],
      newTodo: '',
      delay: 0
    },
    getters: {
      newTodo: (state) => state.newTodo,
      todos: (state) => state.todos,
      loading: (state) => state.loading
    },
    mutations: {
      SET_DELAY(state, delay) {
        state.delay = delay
      },
      SET_LOADING(state, flag) {
        state.loading = flag
      },
      SET_TODOS(state, todos) {
        state.todos = todos
      },
      SET_NEW_TODO(state, todo) {
        state.newTodo = todo
      },
      ADD_TODO(state, todoObject) {
        state.todos.push(todoObject)
      },
      REMOVE_TODO(state, todo) {
        let todos = state.todos
        todos.splice(todos.indexOf(todo), 1)
      },
      CLEAR_NEW_TODO(state) {
        state.newTodo = ''
      }
    },
    actions: {
      setDelay({ commit }, delay) {
        commit('SET_DELAY', delay)
      },

      loadTodos({ commit, state }) {
        console.log('loadTodos start, delay is %d', state.delay)
        setTimeout(() => {
          commit('SET_LOADING', true)

          instance
            .get('/todos')
            .then((r) => r.data)
            .then((todos) => {
              commit('SET_TODOS', todos)
              commit('SET_LOADING', false)
            })
            .catch((e) => {
              console.error('could not load todos')
              console.error(e.message)
              console.error(e.response.data)
            })
            .finally(() => {
              // an easy way for the application to signal
              // that it is done loading
              document.body.classList.add('loaded')
            })
        }, state.delay)
      },

      /**
       * Sets text for the future todo
       *
       * @param {any} { commit }
       * @param {string} todo Message
       */
      setNewTodo({ commit }, todo) {
        commit('SET_NEW_TODO', todo)
      },
      addTodo({ commit, state }) {
        if (!state.newTodo) {
          // do not add empty todos
          return
        }
        const todo = {
          title: state.newTodo,
          completed: false,
          id: randomId()
        }
        // artificial delay in the application
        // for test "flaky test - can pass or not depending on the app's speed"
        // in cypress/integration/08-retry-ability/answer.js
        // increase the timeout delay to make the test fail
        // 50ms should be good
        setTimeout(() => {
          track('todo.add', todo.title)
          instance.post('/todos', todo).then(() => {
            commit('ADD_TODO', todo)
          })
        }, addTodoDelay)
      },
      addEntireTodo({ commit }, todoFields) {
        const todo = {
          ...todoFields,
          id: randomId()
        }
        instance.post('/todos', todo).then(() => {
          commit('ADD_TODO', todo)
        })
      },
      removeTodo({ commit }, todo) {
        track('todo.remove', todo.title)

        instance.delete(`/todos/${todo.id}`).then(() => {
          console.log('removed todo', todo.id, 'from the server')
          commit('REMOVE_TODO', todo)
        })
      },
      async removeCompleted({ commit, state }) {
        const remainingTodos = state.todos.filter((todo) => !todo.completed)
        const completedTodos = state.todos.filter((todo) => todo.completed)

        for (const todo of completedTodos) {
          await instance.delete(`/todos/${todo.id}`)
        }
        commit('SET_TODOS', remainingTodos)
      },
      clearNewTodo({ commit }) {
        commit('CLEAR_NEW_TODO')
      },
      // example promise-returning action
      addTodoAfterDelay({ commit }, { milliseconds, title }) {
        return new Promise((resolve) => {
          setTimeout(() => {
            const todo = {
              title,
              completed: false,
              id: randomId()
            }
            commit('ADD_TODO', todo)
            resolve()
          }, milliseconds)
        })
      }
    }
  })

  // a few helper utilities
  const filters = {
    all: function (todos) {
      return todos
    },
    active: function (todos) {
      return todos.filter(function (todo) {
        return !todo.completed
      })
    },
    completed: function (todos) {
      return todos.filter(function (todo) {
        return todo.completed
      })
    }
  }

  // app Vue instance
  const app = new Vue({
    store,
    data: {
      file: null,
      visibility: 'all'
    },
    el: '.todoapp',

    created() {
      const uri = window.location.search.substring(1)
      const params = new URLSearchParams(uri)
      const delay = parseFloat(params.get('delay') || '0')
      addTodoDelay = parseFloat(params.get('addTodoDelay') || '0')

      this.$store.dispatch('setDelay', delay).then(() => {
        this.$store.dispatch('loadTodos')
      })

      // how would you test the periodic loading of todos?
      setInterval(() => {
        this.$store.dispatch('loadTodos')
      }, 60000)
    },

    // computed properties
    // https://vuejs.org/guide/computed.html
    computed: {
      loading() {
        return this.$store.getters.loading
      },
      newTodo() {
        return this.$store.getters.newTodo
      },
      todos() {
        return this.$store.getters.todos
      },
      filteredTodos() {
        return filters[this.visibility](this.$store.getters.todos)
      },
      remaining() {
        return this.$store.getters.todos.filter((todo) => !todo.completed)
          .length
      }
    },

    // methods that implement data logic.
    // note there's no DOM manipulation here at all.
    methods: {
      pluralize: function (word, count) {
        return word + (count === 1 ? '' : 's')
      },

      setNewTodo(e) {
        this.$store.dispatch('setNewTodo', e.target.value)
      },

      addTodo(e) {
        // do not allow adding empty todos
        if (!e.target.value.trim()) {
          throw new Error('Cannot add a blank todo')
        }
        e.target.value = ''
        this.$store.dispatch('addTodo')
        this.$store.dispatch('clearNewTodo')
      },

      removeTodo(todo) {
        this.$store.dispatch('removeTodo', todo)
      },

      // utility method for create a todo with title and completed state
      addEntireTodo(title, completed = false) {
        this.$store.dispatch('addEntireTodo', { title, completed })
      },

      removeCompleted() {
        this.$store.dispatch('removeCompleted')
      }
    }
  })

  // use the Router from the vendor/director.js library
  ;(function (app, Router) {
    'use strict'

    var router = new Router()

    ;['all', 'active', 'completed'].forEach(function (visibility) {
      router.on(visibility, function () {
        app.visibility = visibility
      })
    })

    router.configure({
      notfound: function () {
        window.location.hash = ''
        app.visibility = 'all'
      }
    })

    router.init()
  })(app, Router)

  // if you want to expose "app" globally only
  // during end-to-end tests you can guard it using "window.Cypress" flag
  // if (window.Cypress) {
  window.app = app
  // }
})()
