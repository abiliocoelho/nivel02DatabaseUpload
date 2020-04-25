import { getRepository, getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const { total } = await transactionRepository.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError('Insuficient', 400);
    }
    const categoryRepository = getRepository(Category);
    const getCategory = await categoryRepository.findOne({
      where: { title: category },
    });
    if (!getCategory) {
      const newCategory = categoryRepository.create({ title: category });
      await categoryRepository.save(newCategory);
      const transaction = transactionRepository.create({
        title,
        value,
        type,
        category_id: newCategory.id,
      });
      await transactionRepository.save(transaction);
      return transaction;
    }
    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: getCategory.id,
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
