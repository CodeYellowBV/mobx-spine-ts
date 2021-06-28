import {Model, ModelData, ModelOptions} from "Model";
import {action, computed, IObservableArray, observable} from "mobx";
import {modelResponseAdapter, ResponseAdapter} from "./Model/BinderResponse";
import {map, isArray, sortBy} from 'lodash';

export interface StoreOptions<T> {
    relations?: string[],     // List of active relations for this store
}

export class Store<T extends ModelData, U extends Model<T>> {
    models: IObservableArray<Model<T>> = observable([]);
    __activeRelations: string[] = []
    comparator: ((o1: Model<T>, o2: Model<T>) => number);


    Model: (new (data?: T, options?: ModelOptions<T>) => Model<T>) = null;

    public constructor(data?: T[], options?: StoreOptions<T>) {
        this.__activeRelations = options?.relations || [];
    }

    public fromBackend<T>(input: ResponseAdapter<T>): void {
        const response = modelResponseAdapter(input);

        this.models.replace(
            (response.data as T[]).map(
                // (ModelData: T) is not working????

                (modelData: ModelData) => {
                    const model = this._newModel();
                    model.fromBackend(
                        {
                            data: modelData,
                            with: response.with,
                            meta: response.meta,
                            with_mapping: response.with_mapping
                        }
                    );
                    return model;
                }
            )
        )
    }

    protected _newModel(data?: T): Model<T> {
        return new this.Model(data, {
            store: this,
            relations: this.__activeRelations
        })
    }

    @computed
    get length(): number {
        return this.models.length;
    }

    map<V>(mapping: (model: Model<T>) => V): V[] {
        return map(this.models, mapping);
    }

    @action
    parse(models: T[]) {
        if (!isArray(models)) {
            throw Error(`Parameter supplied to \`parse()\` is not an array, got: ${JSON.stringify(
                models
            )}`)
        }

        // Parse does not mutate __setChanged, as it is used in
        // fromBackend in the model...
        this.models.replace(models.map(this._newModel.bind(this)));
        this.sort();

        return this;
    }

    @action
    sort(): this {
        if (!this.comparator) {
            return this;
        }
        if (!this.comparator) {
            return this;
        }
        if (typeof this.comparator === 'string') {
            this.models.replace(this.sortBy(this.comparator));
        } else {
            this.models.replace(this.models.slice().sort(this.comparator));
        }
    }

    sortBy(iteratees): Model<T>[] {
        return sortBy(this.models, iteratees);
    }

    /**
     * Get a model from the store by the id. If it doesn't exist, return null
     *
     * @param id
     */
    get(id: number): Model<T> | null {
     return this.models.find(
            model => model[model.constructor['primaryKey']] === id
        );
    }
}