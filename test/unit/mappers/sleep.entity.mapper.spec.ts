import { assert } from 'chai'
import { SleepEntityMapper } from '../../../src/infrastructure/entity/mapper/sleep.entity.mapper'
import { SleepMock } from '../../mocks/sleep.mock'
import { Sleep, SleepType } from '../../../src/application/domain/model/sleep'
import { SleepEntity } from '../../../src/infrastructure/entity/sleep.entity'

describe('Mappers: SleepEntityMapper', () => {
    const sleep: Sleep = new SleepMock()

    // To test how mapper works with an object without any attributes
    const emptySleep: Sleep = new Sleep()

    // Create sleep JSON
    const sleepJSON: any = {
        id: '5a62be07de34500146d9c544',
        start_time: new Date('2018-08-18T01:40:30Z'),
        end_time: new Date('2018-08-18T09:52:30Z'),
        duration: 29520000,
        child_id: '5a62be07de34500146d9c544',
        pattern: sleep.pattern!.data_set,
        type: SleepType.CLASSIC
    }

    // To test how mapper works with an object without any attributes (JSON)
    const emptySleepJSON: any = {}

    describe('transform(item: any)', () => {
        context('when the parameter is of type Sleep', () => {
            it('should normally execute the method, returning a SleepEntity as a result of the transformation', () => {
                const result: SleepEntity = new SleepEntityMapper().transform(sleep)
                assert.propertyVal(result, 'id', sleep.id)
                assert.propertyVal(result, 'start_time', sleep.start_time)
                assert.propertyVal(result, 'end_time', sleep.end_time)
                assert.propertyVal(result, 'duration', sleep.duration)
                assert.propertyVal(result, 'child_id', sleep.child_id)
                assert.propertyVal(result, 'type', sleep.type)
                let i = 0
                for (const dataSetItem of result.pattern!) {
                    assert.deepPropertyVal(dataSetItem, 'start_time', new Date(sleep.pattern!.data_set[i].start_time))
                    assert.deepPropertyVal(dataSetItem, 'name', sleep.pattern!.data_set[i].name)
                    assert.deepPropertyVal(dataSetItem, 'duration', sleep.pattern!.data_set[i].duration)
                    i++
                }
            })
        })

        context('when the parameter is of type Sleep and does not contain any attributes', () => {
            it('should normally execute the method, returning an empty SleepEntity', () => {
                const result: SleepEntity = new SleepEntityMapper().transform(emptySleep)
                assert.isEmpty(result)
            })
        })

        context('when the parameter is a JSON', () => {
            it('should normally execute the method, returning a Sleep as a result of the transformation', () => {
                const result: Sleep = new SleepEntityMapper().transform(sleepJSON)
                assert.propertyVal(result, 'id', sleepJSON.id)
                assert.propertyVal(result, 'start_time', sleepJSON.start_time)
                assert.propertyVal(result, 'end_time', sleepJSON.end_time)
                assert.propertyVal(result, 'duration', sleepJSON.duration)
                assert.propertyVal(result, 'child_id', sleepJSON.child_id)
                assert.propertyVal(result, 'type', sleepJSON.type)
                assert.deepPropertyVal(result.pattern, 'data_set', sleepJSON.pattern)
            })
        })

        context('when the parameter is a JSON and does not contain any attributes', () => {
            it('should normally execute the method, returning a Sleep as a result of the transformation', () => {
                const result: Sleep = new SleepEntityMapper().transform(emptySleepJSON)
                assert.propertyVal(result, 'id', emptySleepJSON.id)
                assert.propertyVal(result, 'start_time', emptySleepJSON.start_time)
                assert.propertyVal(result, 'end_time', emptySleepJSON.end_time)
                assert.propertyVal(result, 'duration', emptySleepJSON.duration)
                assert.propertyVal(result, 'child_id', emptySleepJSON.child_id)
                assert.propertyVal(result, 'type', emptySleepJSON.type)
                assert.propertyVal(result, 'pattern', emptySleepJSON.pattern)
            })
        })

        context('when the parameter is an undefined', () => {
            it('should normally execute the method, returning an empty Sleep as a result of the transformation', () => {
                const result: Sleep = new SleepEntityMapper().transform(undefined)

                assert.propertyVal(result, 'id', undefined)
                assert.propertyVal(result, 'start_time', undefined)
                assert.propertyVal(result, 'end_time', undefined)
                assert.propertyVal(result, 'duration', undefined)
                assert.propertyVal(result, 'child_id', undefined)
                assert.propertyVal(result, 'pattern', undefined)
                assert.propertyVal(result, 'type', undefined)
            })
        })
    })
})
