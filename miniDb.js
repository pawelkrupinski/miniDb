import _ from 'lodash';

export class MiniDb {
    data = []
    dataSet = false
    storageName = undefined

    constructor(data) {
        if (arguments.length) {
            if (!_.isArray(data)) {
                throw "Non-array data passed to MiniDb"
            }
            this.data = data
            this.dataSet = true
        }
    }

    store(name) {
        this.storageName = "minidb_" + name
        if (this.dataSet) {
            localStorage.setItem(this.storageName, JSON.stringify(this.data));
        } else {
            const stored = localStorage.getItem(this.storageName)
            if (stored) {
                this.data = JSON.parse(stored)
            }
        }
        this.dataSet = true  
        return this
    }

    select(json) {
        if (json == undefined) {
            json = {}
        }
        return new Filtered(this, Filters.jsonFilter(json))
    }

    start(at) {
        return new Filtered(this, Filters.start(at))    
    }

    limit(n) {
        return new Filtered(this, Filters.limit(n))    
    }

    insert(record, store = true) {
        this.data.push(record)
        this.dataSet = true
        if (store) {
            this.storeOnChange()
        }
        return this
    }

    insertMany(records) {
        records.forEach(record => this.insert(record, false))
        this.storeOnChange()
        return this
    }

    delete(filter) {
        if (filter == undefined) {
            filter = array => array
        }
        const toDelete = filter(this.data)
        this.data = this.data.filter(record => !toDelete.includes(record))
        this.storeOnChange()
        return this
    }

    update(update, filter) {
        if (filter == undefined) {
            filter = array => array    
        }
        filter(this.data).forEach(record => _.assign(record, update))
        this.storeOnChange()
        return this
    }

    get(filter) {
        if (filter == undefined) {
            filter = array => array
        }
        return filter(this.data)
    }

    storeOnChange() {
        if (this.dataSet && this.storageName) {
            localStorage.setItem(this.storageName, JSON.stringify(this.data));
        }
    }
}

const Filters = {
    jsonFilter: function(json) { 
        return Filters.matchRecords(record => _.isMatch(record, json))
    },

    matchRecords: function(match) {
        return array => array.filter(match)
    },
      
    start: function(at) {
        return array => array.slice(at - 1)
    },
    
    limit: function(to) {
        return array => array.slice(0, to)
    },
}

class Filtered {
    miniDb;
    filters;

    constructor(miniDb, filter) {
        this.miniDb = miniDb
        if (_.isArray(filter)) {
            this.filters = filter
        } else {
            this.filters = [filter]
        }
    }

    select(json) {
        return this.add(Filters.jsonFilter(json))  
    }

    start(at) {
        return this.add(Filters.start(at))      
    }

    limit(n) {
        return this.add(Filters.limit(n))      
    }

    get() {
        return this.miniDb.get(this.effectiveFilter())
    }

    delete() {
        return this.miniDb.delete(this.effectiveFilter())
    }

    update(update) {
        return this.miniDb.update(update, this.effectiveFilter())
    }

    effectiveFilter() {
        return this.filters.reduce((soFar, current) => { 
            return array => current(soFar(array))
        }, array => array)
    }

    add(filter) {
        return new Filtered(this.miniDb, this.filters.concat([filter]))
    }
}