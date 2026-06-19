using System;
using System.Collections.Generic;

namespace ExampleApp.Models
{
    public class Product
    {
        private int _id;
        private string _name;
        private decimal _price;
        protected int _stock;
        public static int InstanceCount { get; private set; }

        public int Id
        {
            get { return _id; }
            set { _id = value; }
        }

        public string Name
        {
            get { return _name; }
            set { _name = value; }
        }

        public decimal Price
        {
            get { return _price; }
            set
            {
                if (value < 0)
                    throw new ArgumentException("Price must be positive");
                _price = value;
            }
        }

        public Product(int id, string name, decimal price)
        {
            _id = id;
            _name = name;
            _price = price;
            _stock = 0;
            InstanceCount++;
        }

        public virtual string GetInfo()
        {
            return $"{Name} - ${Price:F2} (Stock: {_stock})";
        }

        public void Restock(int quantity)
        {
            _stock += quantity;
        }

        public bool Purchase(int quantity)
        {
            if (_stock < quantity) return false;
            _stock -= quantity;
            return true;
        }

        public static Product CreateDefault()
        {
            return new Product(0, "Default", 9.99m);
        }
    }

    public interface IDiscountable
    {
        decimal ApplyDiscount(decimal percentage);
        string GetDiscountInfo();
    }

    public struct Money
    {
        public decimal Amount { get; set; }
        public string Currency { get; set; }

        public Money(decimal amount, string currency)
        {
            Amount = amount;
            Currency = currency;
        }
    }
}
