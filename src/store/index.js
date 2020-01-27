import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import Dash from 'dash';

Vue.use(Vuex);

let demoSDK;

export const identityTypes = {
  application: {
    name: 'application',
    value: 1,
  },
  user: {
    name: 'user',
    value: 2,
  },
};

export default new Vuex.Store({
  state: {
    isSyncing: true,
    mnemonic: 'final vocal warm mansion person awesome sell spend solar tobacco gain canoe',
    errorDetails: null,
    isError: false,
    identities: {
      user: [],
      application: [],
    },
    names: {},
    contracts: {},
    documents: {},
  },
  mutations: {
    addIdentity(state, { identity, type }) {
      state.identities[type.name].push(identity);
    },
    addName(state, { identity, name }) {
      const { id } = identity;
      const names = state.names[id] || [];
      state.names = {
        ...state.names,
        [id]: [
          ...names,
          name,
        ],
      };
    },
    addContract(state, { identity, contract }) {
      const { id } = identity;
      state.contracts = {
        ...state.contracts,
        [id]: contract,
      };
    },
    changeMnemonic(state, mnemonic) {
      state.mnemonic = mnemonic;
    },
    setSyncing(state, syncStatus) {
      state.isSyncing = syncStatus;
    },
    setError(state, error) {
      state.errorDetails = error;
      state.isError = true;
    },
    clearError(state) {
      state.errorDetails = null;
      state.isError = false;
    },
    reset(state) {
      state.errorDetails = null;
      state.isError = false;
      state.isSyncing = true;
    },
  },
  actions: {
    async createIdentity({ commit }, type) {
      const identityId = await demoSDK.platform.identities.register(type);
      const identity = await demoSDK.platform.identities.get(identityId);
      commit('addIdentity', { identity, type: identity.getType() });
    },
    async registerName({ commit }, { identity, name }) {
      await demoSDK.platform.names.register(identity, name);
      commit('addName', { identity, name });
    },
    async registerContract({ commit }, { identity, json }) {
      const contract = await new Promise((resolve) => {
        setTimeout(() => resolve(json), 2000);
      });
      commit('addContract', { identity, contract });
    },
    async initWallet({ commit }) {
      commit('reset', true);
      const { mnemonic } = this.state;

      console.debug('Start wallet sync...');

      try {
        demoSDK = new Dash.SDK({
          mnemonic,
          network: 'testnet',
        });
        await demoSDK.isReady();
      } catch (e) {
        console.debug('Wallet synchronized with an error:');
        console.error(e);
        commit('setError', e);
        commit('setSyncing', false);
        demoSDK.disconnect();
        return;
      }

      console.debug('Wallet is synchronized');

      commit('setSyncing', false);
      // demoSDK.listIdentities().forEach((identity) => {
      //   commit('addIdentity', { identity, type: identity.getType() });
      // });
    },
  },
  getters: {
    identityLists(state) {
      const { identities } = state;
      const lists = Object.keys(identityTypes).map(typeName => ({
        type: identityTypes[typeName],
        items: identities[typeName],
      }));
      return lists;
    },
    userIdentitiesWithNames(state) {
      const { user } = state.identities;
      return user.map(identity => ({
        ...identity,
        names: state.names[identity.id] || [],
      }));
    },
    applicationIdentitiesWithContracts(state) {
      const { application } = state.identities;
      return application.map(identity => ({
        ...identity,
        contract: state.contracts[identity.id],
      }));
    },
    errorDetails(state) {
      return state.errorDetails;
    },
    isSyncing(state) {
      return state.isSyncing;
    },
    isError(state) {
      return state.isError;
    },
  },
  plugins: [createPersistedState()],
});
