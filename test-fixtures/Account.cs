using System;
using System.Collections.Generic;

namespace BankApp
{
    public class Account
    {
        private string accountId;
        private decimal balance;
        protected DateTime createdAt;

        public Account(string accountId)
        {
            this.accountId = accountId;
            this.balance = 0m;
            this.createdAt = DateTime.Now;
        }

        public decimal Balance
        {
            get { return balance; }
        }

        public void Deposit(decimal amount)
        {
            balance += amount;
        }

        public virtual bool Withdraw(decimal amount)
        {
            if (balance >= amount)
            {
                balance -= amount;
                return true;
            }
            return false;
        }
    }

    public class SavingsAccount : Account
    {
        private double interestRate;

        public SavingsAccount(string accountId, double rate) : base(accountId)
        {
            interestRate = rate;
        }

        public decimal ApplyInterest()
        {
            decimal interest = Balance * (decimal)interestRate;
            Deposit(interest);
            return interest;
        }
    }
}
