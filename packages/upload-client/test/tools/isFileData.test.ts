/** @jest-environment jsdom */
import { expect } from '@jest/globals'
import {
  isBlob,
  isBuffer,
  isFile,
  isFileData,
  isReactNativeAsset
} from '../../src/tools/isFileData'

describe('isFileData', () => {
  describe('isBlob', () => {
    it('should return true if Blob is passed', () => {
      expect(isBlob(new Blob(['']))).toBe(true)
    })
    it('should return true if File is passed', () => {
      expect(isBlob(new File([''], 'test.txt'))).toBe(true)
    })
    it('should return false if something else passed', () => {
      expect(isBlob(Buffer.from(''))).toBe(false)
      expect(isBlob('test')).toBe(false)
      expect(isBlob({ uri: 'test' })).toBe(false)
    })
  })
  describe('isFile', () => {
    it('should return true if File is passed', () => {
      expect(isFile(new File([''], 'test.txt'))).toBe(true)
    })
    it('should return false if something else passed', () => {
      expect(isFile(new Blob(['']))).toBe(false)
      expect(isFile(Buffer.from(''))).toBe(false)
      expect(isFile('test')).toBe(false)
      expect(isFile({ uri: 'test' })).toBe(false)
    })
  })
  describe('isBuffer', () => {
    it('should return true if Buffer is passed', () => {
      expect(isBuffer(Buffer.from(''))).toBe(true)
    })
    it('should return false if something else passed', () => {
      expect(isBuffer(new File([''], 'test.txt'))).toBe(false)
      expect(isBuffer(new Blob(['']))).toBe(false)
      expect(isBuffer('test')).toBe(false)
      expect(isBuffer({ uri: 'test' })).toBe(false)
    })
  })
  describe('isReactNativeAsset', () => {
    it('should return true if ReactNative asset is passed', () => {
      expect(isReactNativeAsset({ uri: 'test' })).toBe(true)
    })
    it('should return false if something else passed', () => {
      expect(isReactNativeAsset(Buffer.from(''))).toBe(false)
      expect(isReactNativeAsset(new File([''], 'test.txt'))).toBe(false)
      expect(isReactNativeAsset(new Blob(['']))).toBe(false)
      expect(isReactNativeAsset('test')).toBe(false)
    })
  })
  describe('isFileData', () => {
    it('should return true if any supported file passed', () => {
      expect(isFileData({ uri: 'test' })).toBe(true)
      expect(isFileData(Buffer.from(''))).toBe(true)
      expect(isFileData(new File([''], 'test.txt'))).toBe(true)
      expect(isFileData(new Blob(['']))).toBe(true)
    })
    it('should return false if something else passed', () => {
      expect(isFileData('test')).toBe(false)
    })
  })
})
