import { IEnvironmentRepository } from '../../src/application/port/environment.repository.interface'
import { Environment } from '../../src/application/domain/model/environment'
import { EnvironmentMock } from './environment.mock'

export class EnvironmentRepositoryMock implements IEnvironmentRepository {
    public checkExist(environment: Environment): Promise<boolean> {
        if (environment.id === '507f1f77bcf86cd799439011')
            return Promise.resolve(true)
        return Promise.resolve(false)
    }

    public count(query: any): Promise<number> {
        return Promise.resolve(1)
    }

    public create(item: Environment): Promise<Environment> {
        return Promise.resolve(item)
    }

    public delete(id: string | number): Promise<boolean> {
        if (id === '507f1f77bcf86cd799439011')
            return Promise.resolve(true)
        return Promise.resolve(false)
    }

    public find(query: any): Promise<Array<Environment>> {
        const timestamp: string = ((query.filters).timestamp).toISOString()
        const environmentArr: Array<EnvironmentMock> = new Array<EnvironmentMock>()
        // Only for the test case that returns a filled array
        if (!(timestamp === '2018-03-01T03:00:00.000Z')) {
            for (let i = 0; i < 3; i++) {
                environmentArr.push(new EnvironmentMock())
            }
        }
        return Promise.resolve(environmentArr)
    }

    public findOne(query: any): Promise<Environment> {
        const environment: EnvironmentMock = new EnvironmentMock()
        return Promise.resolve(environment)
    }

    public update(item: Environment): Promise<Environment> {
        return Promise.resolve(item)
    }

}